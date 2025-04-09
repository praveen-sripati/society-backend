const BaseController = require('./baseController');
const { constructFilePath, deleteFile, deleteFileIfExists } = require('../utils/fileUtils');
const noticeService = require('../services/noticeService'); // Import noticeService

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

    try {
      const notice = await noticeService.createNotice(title, content, category, imageUrl, pdfAttachments, posted_by); // Call service
      return this.sendResponse(res, { notice }, 'Notice created successfully', 201);
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // Get all notices (protected, with optional filtering)
  async getAllNotices(req, res) {
    const { category, search } = req.query;

    try {
      const notices = await noticeService.getAllNotices(category, search); // Call service
      return this.sendResponse(res, { notices });
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // Get a specific notice by ID (protected)
  async getNoticeById(req, res) {
    const { id } = req.params;

    try {
      const notice = await noticeService.getNoticeById(id); // Call service
      if (!notice) {
        return this.sendError(res, new Error('Notice not found.'), 404);
      }
      return this.sendResponse(res, { notice });
    } catch (error) {
      return this.sendError(res, error);
    }
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
    let existingNotice = null;
    try {
      existingNotice = await noticeService.getNoticeById(id);
      if (!existingNotice) {
        return this.sendError(res, new Error('Notice not found.'), 404);
      }
    } catch (error) {
      return this.sendError(res, error);
    }

    // Check authorization to update
    if (!(userRole === 'admin') && !(existingNotice?.posted_by === userId)) {
      return this.sendError(res, new Error('You are not authorized to update this notice.'), 403);
    }

    // Check and delete previous image if user has update image with new one or removed
    if (
      existingNotice?.image_url && ((existingNotice?.image_url && !req.body.current_image_url && !req.files['image']) ||
      (existingNotice?.image_url !== imageUrl) && req.files['image'])
    ) {
      const imageFilePath = constructFilePath(existingNotice.image_url);
      if (imageFilePath) await deleteFileIfExists(imageFilePath);
    }

    // Check and delete previous image if user has update image with new one or removed
    if (
      existingNotice?.attachments?.url && ((!req.body.current_pdf_url && !req.files['pdfAttachment']) ||
      (existingNotice?.attachments?.url !== pdfUrl && req.files['pdfAttachment']))
    ) {
      const pdfFilePath = constructFilePath(existingNotice.attachments?.url);
      if (pdfFilePath) await deleteFileIfExists(pdfFilePath);
    }

    let pdfAttachments = null;
    if (pdfUrl) {
      const filename = req.body.current_pdf_url ? existingNotice?.attachments?.filename : req.files['pdfAttachment'][0].filename
      pdfAttachments = { 
        url: pdfUrl, 
        filename
      };
    }

    let updatedNotice = null;
    try {
      updatedNotice = await noticeService.updateNotice(id, title, content, category, imageUrl, pdfAttachments); // Call service
      return this.sendResponse(res, { notice: updatedNotice }, 'Notice updated successfully');
    } catch (error) {
      return this.sendError(res, error);
    }
  }

  // Delete a notice (protected, poster or admin only)
  async deleteNotice(req, res) {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;
    
    // Query Existing Notice
    let existingNotice = null;
    try {
      existingNotice = await noticeService.getNoticeById(id);
      if (!existingNotice) {
        return this.sendError(res, new Error('Notice not found.'), 404);
      }
    } catch (error) {
      return this.sendError(res, error);
    }

    const postedBy = existingNotice?.posted_by;
    const isAdmin = userRole === 'admin';
    const isPoster = postedBy === userId;

    if (!isAdmin && !isPoster) {
      return this.sendError(res, new Error('You are not authorized to delete this notice.'), 403);
    }

    let imageUrl = null;
    let pdfUrl = null;

    imageUrl = existingNotice?.image_url;
    pdfUrl = existingNotice?.attachments ? existingNotice?.attachments?.url : null;

    try {
      await noticeService.deleteNotice(id); // Call service

      if (imageUrl) {
        const filePath = constructFilePath(imageUrl);
        await deleteFile(filePath);
      }

      if (pdfUrl) {
        const filePath = constructFilePath(pdfUrl);
        await deleteFile(filePath);
      }

      return this.sendResponse(res, null, 'Notice deleted successfully');
    } catch (error) {
      return this.sendError(res, error);
    }
  }
}

module.exports = new NoticeController();