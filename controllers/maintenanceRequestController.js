const { pool } = require('../config/database');
const BaseController = require('./baseController');

class MaintenanceRequestController extends BaseController {
    // Create a new maintenance request (protected, resident only)
    async createRequest(req, res) {
        const { apartment_number, category, description, location_details, priority } = req.body;
        const resident_id = req.user.userId;

        if (!apartment_number || !category || !description) {
            return this.sendError(res, new Error('Apartment number, category, and description are required.'), 400);
        }

        if (!['plumbing', 'electrical', 'carpentry', 'appliance', 'other'].includes(category)) {
            return this.sendError(res, new Error('Invalid category.'), 400);
        }

        if (priority && !['high', 'medium', 'low'].includes(priority)) {
            return this.sendError(res, new Error('Invalid priority.'), 400);
        }

        const newRequest = await pool.query(
            'INSERT INTO maintenance_requests (resident_id, apartment_number, category, description, location_details, priority) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
            [resident_id, apartment_number, category, description, location_details, priority || 'medium']
        );

        return this.sendResponse(res, { request: newRequest.rows[0] }, 'Maintenance request created successfully', 201);
    }

    // Get all maintenance requests (protected, with optional filtering)
    async getAllRequests(req, res) {
        const { category, status, priority, page, limit } = req.query;
        let query = 'SELECT * FROM maintenance_requests';
        const values = [];
        const filters = [];

        if (category) {
            filters.push('category = $' + (filters.length + 1));
            values.push(category);
        }

        if (status) {
            filters.push('status = $' + (filters.length + 1));
            values.push(status);
        }

        if (priority) {
            filters.push('priority = $' + (filters.length + 1));
            values.push(priority);
        }

        if (filters.length > 0) {
            query += ' WHERE ' + filters.join(' AND ');
        }

        query += ' ORDER BY request_date DESC';

        if (page && limit) {
            const offset = (parseInt(page) - 1) * parseInt(limit);
            query += ' LIMIT $' + (values.length + 1) + ' OFFSET $' + (values.length + 2);
            values.push(parseInt(limit), offset);
        }

        const result = await pool.query(query, values);
        return this.sendResponse(res, { requests: result.rows });
    }

    // Get a specific maintenance request by ID (protected)
    async getRequestById(req, res) {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1', [id]);
        
        if (result.rows.length === 0) {
            return this.sendError(res, new Error('Maintenance request not found.'), 404);
        }
        
        return this.sendResponse(res, { request: result.rows[0] });
    }

    // Update a maintenance request (protected, committee/admin only)
    async updateRequest(req, res) {
        const { id } = req.params;
        const { status, assigned_to } = req.body;
        const userId = req.user.userId;
        const userRole = req.user.role;

        const allowedRoles = ['committee', 'admin'];
        if (!allowedRoles.includes(userRole)) {
            return this.sendError(res, new Error('You are not authorized to update maintenance requests.'), 403);
        }

        if (!status && !assigned_to) {
            return this.sendError(res, new Error('At least one of status or assigned_to is required for updating.'), 400);
        }

        const existingRequest = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1', [id]);
        if (existingRequest.rows.length === 0) {
            return this.sendError(res, new Error('Maintenance request not found.'), 404);
        }

        let updateQuery = 'UPDATE maintenance_requests SET ';
        const updateValues = [];
        let updateFields = [];

        if (status) {
            updateFields.push('status = $' + (updateValues.length + 1));
            updateValues.push(status);
        }

        if (assigned_to) {
            updateFields.push('assigned_to = $' + (updateValues.length + 1));
            updateValues.push(assigned_to);
        }

        updateQuery += updateFields.join(', ') + ' WHERE id = $' + (updateValues.length + 1) + ' RETURNING *';
        updateValues.push(id);

        const updatedRequest = await pool.query(updateQuery, updateValues);

        // Create an update record
        await pool.query(
            'INSERT INTO maintenance_request_updates (request_id, updated_by, status, assigned_to) VALUES ($1, $2, $3, $4)',
            [id, userId, status, assigned_to]
        );

        return this.sendResponse(res, { request: updatedRequest.rows[0] }, 'Maintenance request updated successfully');
    }

    // Submit feedback for a maintenance request (protected, resident only)
    async submitFeedback(req, res) {
        const { id } = req.params;
        const { rating, comment } = req.body;
        const userRole = req.user.role;

        if (userRole !== 'resident') {
            return this.sendError(res, new Error('Only residents can provide feedback.'), 403);
        }

        if (!rating || rating < 1 || rating > 5) {
            return this.sendError(res, new Error('Rating is required and must be between 1 and 5.'), 400);
        }

        const existingRequest = await pool.query('SELECT * FROM maintenance_requests WHERE id = $1', [id]);
        if (existingRequest.rows.length === 0) {
            return this.sendError(res, new Error('Maintenance request not found.'), 404);
        }

        const newFeedback = await pool.query(
            'INSERT INTO maintenance_request_feedback (request_id, rating, comment) VALUES ($1, $2, $3) RETURNING *',
            [id, rating, comment]
        );

        return this.sendResponse(res, { feedback: newFeedback.rows[0] }, 'Feedback submitted successfully', 201);
    }
}

module.exports = new MaintenanceRequestController(); 