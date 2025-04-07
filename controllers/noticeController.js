const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');
const BaseController = require('./baseController');
const { constructFilePath, deleteFile, deleteFileIfExists } = require('../utils/fileUtils');

class NoticeController extends BaseController {
  // Create a new notice (protected, committee/admin only)

  async createNotice(req, res) {
    const { title, content, category } = req.body;
    const posted_by = req.user.userId;
    const userRole = req.user.role;
    let imageUrl = null;
    let pdfUrl = null;

    if (req.files) {
      const protocol = req.protocol; // 'http' or 'https'
      const host = req.get('host'); // e.g., 'localhost:3000' or your domain name
      if (req.files['image']) {
        imageUrl = `${protocol}://${host}/uploads/notices/images/${req.files['image'][0].filename}`; // Full URL
      }
      if (req.files['pdfAttachment']) {
        pdfUrl = `${protocol}://${host}/uploads/notices/pdfs/${req.files['pdfAttachment'][0].filename}`; // Full URL
      }
    }

    const allowedRoles = ['committee', 'admin'];
    if (!allowedRoles.includes(userRole)) {
      return this.sendError(res, new Error('You are not authorized to post notices.'), 403);
    }

    if (!title || !content || !category) {
      return this.sendError(res, new Error('Title, content, and category are required.'), 400);
    }

    if (!['maintenance', 'events', 'security', 'general'].includes(category)) {
      return this.sendError(res, new Error('Invalid notice category.'), 400);
    }

    let pdfAttachments = null;
    if (req.files['pdfAttachment']?.length) {
      pdfAttachments = { url: pdfUrl, filename: req.files['pdfAttachment'][0].filename };
    }

    const newNotice = await pool.query(
      'INSERT INTO notices (title, content, category, posted_by, attachments, image_url) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, content, category, posted_by, JSON.stringify(pdfAttachments) || null, imageUrl || null]
    );

    return this.sendResponse(res, { notice: newNotice.rows[0] }, 'Notice created successfully', 201);
  }

  // Get all notices (protected, with optional filtering)
  async getAllNotices(req, res) {
    const { category, search } = req.query;
    let query = 'SELECT * FROM notices';
    const values = [];
    const conditions = [];

    if (category && category !== 'all') {
      if (!['maintenance', 'events', 'security', 'general'].includes(category)) {
        return this.sendError(res, new Error('Invalid notice category.'), 400);
      }
      values.push(category);
      conditions.push(`category = $${values.length}`);
    }

    if (search) {
      values.push(`%${search.toLowerCase()}%`);
      conditions.push(`(LOWER(title) LIKE $${values.length} OR LOWER(content) LIKE $${values.length})`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC';

    const notices = await pool.query(query, values);
    return this.sendResponse(res, { notices: notices.rows });
  }

  // Get a specific notice by ID (protected)
  async getNoticeById(req, res) {
    const { id } = req.params;
    const notice = await pool.query('SELECT * FROM notices WHERE id = $1', [id]);

    if (notice.rows.length === 0) {
      return this.sendError(res, new Error('Notice not found.'), 404);
    }

    return this.sendResponse(res, { notice: notice.rows[0] });
  }

  // Update a notice (protected, poster or admin only)
  async updateNotice(req, res) {
    const { id } = req.params;
    const { title, content, category } = req.body;
    const userId = req.user.userId;
    const userRole = req.user.role;
    let imageUrl = req.body.current_image_url ? req.body.current_image_url : null;
    let pdfUrl = req.body.current_pdf_url ? req.body.current_pdf_url : null;

    // Update imageUrl/pdfUrl if request has any files attached
    console.log('files => ', req.files);
    if (req.files) {
      const protocol = req.protocol; // 'http' or 'https'
      const host = req.get('host'); // e.g., 'localhost:3000' or your domain name
      if (req.files['image']) {
        imageUrl = `${protocol}://${host}/uploads/notices/images/${req.files['image'][0].filename}`; // Full URL
      }
      if (req.files['pdfAttachment']) {
        pdfUrl = `${protocol}://${host}/uploads/notices/pdfs/${req.files['pdfAttachment'][0].filename}`; // Full URL
      }
    }

    // Required Validation Check for title, content and category
    if (!title || !content || !category) {
      return this.sendError(res, new Error('Title, content, and category are required for updating.'), 400);
    }

    // Invalid Notice Category Check
    if (!['maintenance', 'events', 'security', 'general'].includes(category)) {
      return this.sendError(res, new Error('Invalid notice category.'), 400);
    }

    // Query Existing Notice
    const existingNotice = await pool.query('SELECT image_url, attachments, posted_by FROM notices WHERE id = $1', [
      id,
    ]);

    // Existing id note is not present then show error
    if (existingNotice.rows.length === 0) {
      return this.sendError(res, new Error('Notice not found.'), 404);
    }

    // Check authorization to update
    if (!(userRole === 'admin') && !(existingNotice.rows[0].posted_by === userId)) {
      return this.sendError(res, new Error('You are not authorized to update this notice.'), 403);
    }

    // Check and delete previous images/pdf if user has update image/pdf with new one or removed
    if (
      existingNotice.rows[0].image_url &&
      ((existingNotice.rows[0].image_url && !req.body.current_image_url && !req.files['image']) ||
      (existingNotice.rows[0].image_url !== imageUrl) && req.files['image'])
    ) {
      const imageFilePath = constructFilePath(existingNotice.rows[0].image_url);
      if (imageFilePath) await deleteFileIfExists(imageFilePath);
    }

    console.log(">>-1 ",existingNotice.rows[0].attachments?.url);
    console.log(">>-2 ",pdfUrl);
    console.log(">>-3 ",req.files['pdfAttachment']);
    if (
      existingNotice.rows[0].attachments?.url &&
      ((!req.body.current_pdf_url && !req.files['pdfAttachment']) ||
      (existingNotice.rows[0].attachments?.url !== pdfUrl && req.files['pdfAttachment']))
    ) {
      const pdfFilePath = constructFilePath(existingNotice.rows[0].attachments?.url);
      if (pdfFilePath) await deleteFileIfExists(pdfFilePath);
    }

    let pdfAttachments = null;
    if (pdfUrl) {
      const filename = req.body.current_pdf_url ? existingNotice.rows[0].attachments?.filename : req.files['pdfAttachment'][0].filename
      pdfAttachments = { 
        url: pdfUrl, 
        filename
      };
    }
    let updatedNotice = null;
    updatedNotice = await pool.query(
      'UPDATE notices SET title = $1, content = $2, category = $3, image_url = $4, attachments = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [title, content, category, imageUrl, pdfAttachments ? JSON.stringify(pdfAttachments) : null, id]
    );

    return this.sendResponse(res, { notice: updatedNotice.rows[0] }, 'Notice updated successfully');
  }

  // Delete a notice (protected, poster or admin only)
  async deleteNotice(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    const existingNotice = await pool.query('SELECT attachments, image_url, posted_by FROM notices WHERE id = $1', [
      id,
    ]);
    if (existingNotice.rows.length === 0) {
      return this.sendError(res, new Error('Notice not found.'), 404);
    }

    const postedBy = existingNotice.rows[0].posted_by;
    const isAdmin = userRole === 'admin';
    const isPoster = postedBy === userId;

    if (!isAdmin && !isPoster) {
      return this.sendError(res, new Error('You are not authorized to delete this notice.'), 403);
    }

    let imageUrl = null;
    let pdfUrl = null;

    imageUrl = existingNotice.rows[0].image_url;
    console.log('existingNotice=> ', existingNotice.rows[0]);
    pdfUrl = existingNotice.rows[0].attachments ? existingNotice.rows[0].attachments.url : null;

    await pool.query('DELETE FROM notices WHERE id = $1', [id]);

    if (imageUrl) {
      const filePath = constructFilePath(imageUrl);
      await deleteFile(filePath);
    }

    if (pdfUrl) {
      const filePath = constructFilePath(pdfUrl);
      await deleteFile(filePath);
    }

    return this.sendResponse(res, null, 'Notice deleted successfully');
  }
}

module.exports = new NoticeController();
