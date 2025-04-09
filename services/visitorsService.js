const { pool } = require('../config/database'); // Adjust the path as needed

const visitorsService = {
  createPreApproval: async (resident_id, visitor_name, arrival_time, departure_time, purpose, apartment_number) => {
    try {
      const newPreApproval = await pool.query(
        'INSERT INTO pre_approvals (resident_id, visitor_name, arrival_time, departure_time, purpose, apartment_number) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
        [resident_id, visitor_name, arrival_time, departure_time, purpose, apartment_number]
      );

      return newPreApproval.rows[0];
    } catch (error) {
      console.error('Error creating pre-approval in service:', error);
      throw error;
    }
  },

  getAllPreApprovals: async () => {
    try {
      const preApprovals = await pool.query('SELECT * FROM pre_approvals ORDER BY arrival_time');

      return preApprovals.rows;
    } catch (error) {
      console.error('Error fetching pre-approvals in service:', error);
      throw error;
    }
  },

  getPaginatedPreApprovals: async (page = 1, limit = 10) => {
    try {
      const offset = (Number(page) - 1) * Number(limit);
      const limitNumber = Number(limit);

      // Fetch paginated data
      const preApprovalsQuery = {
        text: 'SELECT * FROM pre_approvals ORDER BY arrival_time LIMIT $1 OFFSET $2',
        values: [limitNumber, offset],
      };
      const preApprovalsResult = await pool.query(preApprovalsQuery);
      const preApprovals = preApprovalsResult.rows;

      const totalResult = await pool.query('SELECT COUNT(*) FROM pre_approvals');
      const total = parseInt(totalResult.rows[0].count, 10);

      return { data: preApprovals, total };
    } catch (error) {
      console.error('Error fetching paginated pre-approvals in service:', error);
      throw error;
    }
  },

  getPreApprovalById: async (id) => {
    try {
      const preApprovalResult = await pool.query('SELECT * FROM pre_approvals WHERE id = $1', [id]);

      return preApprovalResult.rows[0];
    } catch (error) {
      console.error('Error fetching pre-approval by ID in service:', error);
      throw error;
    }
  },

  updatePreApproval: async (id, visitor_name, arrival_time, departure_time, purpose, apartment_number) => {
    try {
      const updatedPreApproval = await pool.query(
        'UPDATE pre_approvals SET visitor_name = $1, arrival_time = $2, departure_time = $3, purpose = $4, apartment_number = $5 WHERE id = $6 RETURNING *',
        [visitor_name, arrival_time, departure_time, purpose, apartment_number, id]
      );

      return updatedPreApproval.rows[0];
    } catch (error) {
      console.error('Error updating pre-approval in service:', error);
      throw error;
    }
  },

  deletePreApproval: async (id) => {
    try {
      await pool.query('DELETE FROM pre_approvals WHERE id = $1', [id]);
    } catch (error) {
      console.error('Error deleting pre-approval in service:', error);
      throw error;
    }
  },
};

module.exports = visitorsService;
