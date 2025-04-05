const { pool } = require('../config/database');
const BaseController = require('./baseController');

class NoticeController extends BaseController {
    // Create a new notice (protected, committee/admin only)
    async createNotice(req, res) {
        const { title, content, category, attachments } = req.body;
        const posted_by = req.user.userId;
        const userRole = req.user.role;

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

        const attachmentsJSON = attachments ? JSON.stringify(attachments) : null;
        const newNotice = await pool.query(
            'INSERT INTO notices (title, content, category, posted_by, attachments) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [title, content, category, posted_by, attachmentsJSON || null]
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
        const { title, content, category, attachments } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        if (!title || !content || !category) {
            return this.sendError(res, new Error('Title, content, and category are required for updating.'), 400);
        }

        if (!['maintenance', 'events', 'security', 'general'].includes(category)) {
            return this.sendError(res, new Error('Invalid notice category.'), 400);
        }

        const existingNotice = await pool.query('SELECT posted_by FROM notices WHERE id = $1', [id]);
        if (existingNotice.rows.length === 0) {
            return this.sendError(res, new Error('Notice not found.'), 404);
        }

        const postedBy = existingNotice.rows[0].posted_by;
        const isAdmin = userRole === 'admin';
        const isPoster = postedBy === userId;

        if (!isAdmin && !isPoster) {
            return this.sendError(res, new Error('You are not authorized to update this notice.'), 403);
        }

        const attachmentsJSON = attachments ? JSON.stringify(attachments) : null;
        const updatedNotice = await pool.query(
            'UPDATE notices SET title = $1, content = $2, category = $3, attachments = $4, updated_at = NOW() WHERE id = $5 RETURNING *',
            [title, content, category, attachmentsJSON, id]
        );

        return this.sendResponse(res, { notice: updatedNotice.rows[0] }, 'Notice updated successfully');
    }

    // Delete a notice (protected, poster or admin only)
    async deleteNotice(req, res) {
        const { id } = req.params;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const existingNotice = await pool.query('SELECT posted_by FROM notices WHERE id = $1', [id]);
        if (existingNotice.rows.length === 0) {
            return this.sendError(res, new Error('Notice not found.'), 404);
        }

        const postedBy = existingNotice.rows[0].posted_by;
        const isAdmin = userRole === 'admin';
        const isPoster = postedBy === userId;

        if (!isAdmin && !isPoster) {
            return this.sendError(res, new Error('You are not authorized to delete this notice.'), 403);
        }

        await pool.query('DELETE FROM notices WHERE id = $1', [id]);
        return this.sendResponse(res, null, 'Notice deleted successfully');
    }
}

module.exports = new NoticeController(); 