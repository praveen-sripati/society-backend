const { pool } = require('../config/database');
const BaseController = require('./baseController');

class ChatController extends BaseController {
    // Group Management
    async createGroup(req, res) {
        const { name, description, is_direct, recipient_id } = req.body;
        const created_by = req.user.userId;

        if (!name) {
            return this.sendError(res, new Error('Group name is required.'), 400);
        }

        if (is_direct) {
            if (!recipient_id) {
                return this.sendError(res, new Error('Recipient ID is required for direct message.'), 400);
            }

            const directMessageName = [created_by, recipient_id].sort().join('-');
            const existingGroup = await pool.query('SELECT * FROM groups WHERE name = $1', [directMessageName]);

            if (existingGroup.rows.length > 0) {
                return this.sendError(res, new Error('Direct message chat already exists.'), 409);
            }

            const newGroup = await pool.query(
                'INSERT INTO groups (name, description, created_by, is_direct) VALUES ($1, $2, $3, $4) RETURNING *',
                [directMessageName, description, created_by, true]
            );

            await pool.query(
                'INSERT INTO user_group_memberships (user_id, group_id) VALUES ($1, $2)',
                [created_by, newGroup.rows[0].id]
            );

            await pool.query(
                'INSERT INTO user_group_memberships (user_id, group_id) VALUES ($1, $2)',
                [recipient_id, newGroup.rows[0].id]
            );

            return this.sendResponse(res, { group: newGroup.rows[0] }, 'Direct message chat created successfully', 201);
        } else {
            const newGroup = await pool.query(
                'INSERT INTO groups (name, description, created_by, is_direct) VALUES ($1, $2, $3, $4) RETURNING *',
                [name, description, created_by, false]
            );

            return this.sendResponse(res, { group: newGroup.rows[0] }, 'Group created successfully', 201);
        }
    }

    async getAllGroups(req, res) {
        const groups = await pool.query('SELECT * FROM groups');
        return this.sendResponse(res, { groups: groups.rows });
    }

    async getGroupById(req, res) {
        const { id } = req.params;
        const group = await pool.query('SELECT * FROM groups WHERE id = $1', [id]);
        
        if (group.rows.length === 0) {
            return this.sendError(res, new Error('Group not found.'), 404);
        }
        
        return this.sendResponse(res, { group: group.rows[0] });
    }

    // Message Management
    async sendMessage(req, res) {
        const { content, group_id, media_url } = req.body;
        const sender_id = req.user.userId;
        let reply_to_id = null;

        if (!content) {
            return this.sendError(res, new Error('Message content is required.'), 400);
        }

        const tagRegex = /@message(\d+)/;
        const tagMatch = content.match(tagRegex);

        if (tagMatch) {
            reply_to_id = parseInt(tagMatch[1], 10);
        }

        const newMessage = await pool.query(
            'INSERT INTO messages (content, sender_id, group_id, reply_to_id, media_url) VALUES ($1, $2, $3, $4, $5) RETURNING *',
            [content, sender_id, group_id || null, reply_to_id || null, media_url || null]
        );

        return this.sendResponse(res, { message: newMessage.rows[0] }, 'Message sent successfully', 201);
    }

    async getAllMessages(req, res) {
        const { group_id } = req.query;
        let query = 'SELECT * FROM messages ORDER BY created_at';
        const values = [];

        if (group_id) {
            query = 'SELECT * FROM messages WHERE group_id = $1 ORDER BY created_at';
            values.push(group_id);
        }

        const messages = await pool.query(query, values);
        return this.sendResponse(res, { messages: messages.rows });
    }

    async getMessageById(req, res) {
        const { id } = req.params;
        const message = await pool.query('SELECT * FROM messages WHERE id = $1', [id]);
        
        if (message.rows.length === 0) {
            return this.sendError(res, new Error('Message not found.'), 404);
        }
        
        return this.sendResponse(res, { message: message.rows[0] });
    }
}

module.exports = new ChatController(); 