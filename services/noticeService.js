const { pool } = require('../config/database'); // Adjust the path as needed

const noticeService = {
  createNotice: async (title, content, category, imageUrl, pdfAttachments, posted_by) => {
    const newNotice = await pool.query(
      'INSERT INTO notices (title, content, category, image_url, attachments, posted_by) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [title, content, category, imageUrl, JSON.stringify(pdfAttachments) || null, posted_by]
    );
    return newNotice.rows[0];
  },

  getAllNotices: async (category, search) => {
    let query = 'SELECT * FROM notices';
    const values = [];
    const conditions = [];

    if (category && category !== 'all') {
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
    return notices.rows;
  },

  getNoticeById: async (id) => {
    const notice = await pool.query('SELECT * FROM notices WHERE id = $1', [id]);
    return notice.rows[0];
  },

  updateNotice: async (id, title, content, category, imageUrl, pdfAttachments) => {
    const updatedNotice = await pool.query(
      'UPDATE notices SET title = $1, content = $2, category = $3, image_url = $4, attachments = $5, updated_at = NOW() WHERE id = $6 RETURNING *',
      [title, content, category, imageUrl, pdfAttachments ? JSON.stringify(pdfAttachments) : null, id]
    );
    return updatedNotice.rows[0];
  },

  deleteNotice: async (id) => {
    await pool.query('DELETE FROM notices WHERE id = $1', [id]);
  },
};

module.exports = noticeService;