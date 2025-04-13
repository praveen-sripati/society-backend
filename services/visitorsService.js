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

  getPaginatedPreApprovalsStatusPending: async (page = 1, limit = 10) => {
    try {
      const offset = (Number(page) - 1) * Number(limit);
      const limitNumber = Number(limit);

      const preApprovalsQuery = {
        text: `
              SELECT * FROM pre_approvals 
              WHERE status = 'pending'
              ORDER BY arrival_time ASC 
              LIMIT $1 OFFSET $2
          `,
        values: [limitNumber, offset],
      };
      const preApprovalsResult = await pool.query(preApprovalsQuery);
      const preApprovals = preApprovalsResult.rows;

      const totalQuery = {
        text: `SELECT COUNT(*) FROM pre_approvals WHERE arrival_time > NOW()`,
        values: [],
      };
      const totalResult = await pool.query(totalQuery);
      const total = parseInt(totalResult.rows[0].count, 10);

      return { data: preApprovals, total };
    } catch (error) {
      console.error('Error fetching paginated upcoming pre-approvals:', error);
      throw error;
    }
  },

  getPaginatedPreApprovalsStatusExpired: async (page = 1, limit = 10) => {
    try {
      const offset = (Number(page) - 1) * Number(limit);
      const limitNumber = Number(limit);

      const preApprovalsQuery = {
        text: `
              SELECT * FROM pre_approvals 
              WHERE status = 'expired'
              ORDER BY arrival_time DESC 
              LIMIT $1 OFFSET $2
          `,
        values: [limitNumber, offset],
      };
      const preApprovalsResult = await pool.query(preApprovalsQuery);
      const preApprovals = preApprovalsResult.rows;

      const totalQuery = {
        text: `SELECT COUNT(*) FROM pre_approvals WHERE arrival_time < NOW()`,
        values: [],
      };
      const totalResult = await pool.query(totalQuery);
      const total = parseInt(totalResult.rows[0].count, 10);

      return { data: preApprovals, total };
    } catch (error) {
      console.error('Error fetching paginated expired pre-approvals:', error);
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

  createArrival: async (data, securityGuardId) => {
    try {
      const result = await pool.query(
        'INSERT INTO visitor_activity (pre_approval_id, visitor_name, arrival_time, security_guard_checkin) VALUES ($1, $2, NOW(), $3) RETURNING *',
        [data.pre_approval_id, data.visitor_name, securityGuardId]
      );
      await pool.query(
        'UPDATE pre_approvals SET status = $1 WHERE id = $2',
        ['checked_in', data.pre_approval_id]
      );
      return result.rows[0];
    } catch (error) {
      throw error;
    }
  },

  createDeparture: async (arrivalId, securityGuardId) => {
    try {
      const result = await pool.query(
        'UPDATE visitor_activity SET departure_time = NOW(), security_guard_checkout = $1 WHERE id = $2 RETURNING *',
        [securityGuardId, arrivalId]
      );
      return result.rows[0] || null;
    } catch (error) {
      throw error;
    }
  },

  getArrivals: async (date, page = 1, limit = 10) => {
    try {
      let query = `
            SELECT va.*, pa.visitor_name, pa.apartment_number
            FROM visitor_activity va
            LEFT JOIN pre_approvals pa ON va.pre_approval_id = pa.id
            WHERE va.security_guard_checkin IS NOT NULL
        `;
      const values = [];
      const conditions = [];

      if (date) {
        conditions.push(`DATE(va.arrival_time) = $${values.length + 1}`);
        values.push(date);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const countQuery = `SELECT COUNT(*) FROM visitor_activity WHERE security_guard_checkin IS NOT NULL ${
        date ? ` AND DATE(arrival_time) = $1` : ''
      }`;
      const countValues = date ? [date] : [];
      const totalResult = await pool.query(countQuery, countValues);
      const total = parseInt(totalResult.rows[0].count, 10);

      query += ' ORDER BY va.arrival_time DESC LIMIT $1 OFFSET $2';
      values.push(limit, (page - 1) * limit);

      const result = await pool.query(query, values);
      return {
        data: result.rows,
        total,
      };
    } catch (error) {
      throw error;
    }
  },

  getDepartures: async (date, page = 1, limit = 10) => {
    try {
      let query = `
            SELECT va.*, pa.visitor_name, pa.apartment_number
            FROM visitor_activity va
            LEFT JOIN pre_approvals pa ON va.pre_approval_id = pa.id
            WHERE va.departure_time IS NOT NULL
        `;
      const values = [];
      const conditions = [];

      if (date) {
        conditions.push(`DATE(va.departure_time) = $${values.length + 1}`);
        values.push(date);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const countQuery = `SELECT COUNT(*) FROM visitor_activity WHERE departure_time IS NOT NULL ${
        date ? ` AND DATE(departure_time) = $1` : ''
      }`;
      const countValues = date ? [date] : [];
      const totalResult = await pool.query(countQuery, countValues);
      const total = parseInt(totalResult.rows[0].count, 10);

      query += ' ORDER BY va.departure_time DESC LIMIT $1 OFFSET $2';
      values.push(limit, (page - 1) * limit);

      const result = await pool.query(query, values);
      return {
        data: result.rows,
        total,
      };
    } catch (error) {
      throw error;
    }
  },

  getPaginatedArrivals: async (date, page = 1, limit = 10) => {
    try {
      let query = `
            SELECT va.*, pa.visitor_name, pa.apartment_number
            FROM visitor_activity va
            LEFT JOIN pre_approvals pa ON va.pre_approval_id = pa.id
            WHERE va.arrival_time IS NOT NULL
        `;
      const values = [];
      const conditions = [];

      if (date) {
        conditions.push(`DATE(va.arrival_time) = $${values.length + 1}`);
        values.push(date);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const countQuery = `SELECT COUNT(*) FROM visitor_activity WHERE arrival_time IS NOT NULL ${
        date ? ` AND DATE(arrival_time) = $1` : ''
      }`;
      const countValues = date ? [date] : [];
      const totalResult = await pool.query(countQuery, countValues);
      const total = parseInt(totalResult.rows[0].count, 10);

      query += ' ORDER BY va.arrival_time DESC LIMIT $1 OFFSET $2';
      values.push(limit, (page - 1) * limit);

      const arrivalsResult = await pool.query(query, values);
      const arrivals = arrivalsResult.rows;

      return {
        data: arrivals,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  },

  getPaginatedDepartures: async (date, page = 1, limit = 10) => {
    try {
      let query = `
            SELECT va.*, pa.visitor_name, pa.apartment_number
            FROM visitor_activity va
            LEFT JOIN pre_approvals pa ON va.pre_approval_id = pa.id
            WHERE va.departure_time IS NOT NULL
        `;
      const values = [];
      const conditions = [];

      if (date) {
        conditions.push(`DATE(va.departure_time) = $${values.length + 1}`);
        values.push(date);
      }

      if (conditions.length > 0) {
        query += ' WHERE ' + conditions.join(' AND ');
      }

      const countQuery = `SELECT COUNT(*) FROM visitor_activity WHERE departure_time IS NOT NULL ${
        date ? ` AND DATE(departure_time) = $1` : ''
      }`;
      const countValues = date ? [date] : [];
      const totalResult = await pool.query(countQuery, countValues);
      const total = parseInt(totalResult.rows[0].count, 10);

      query += ' ORDER BY va.departure_time DESC LIMIT $1 OFFSET $2';
      values.push(limit, (page - 1) * limit);

      const departuresResult = await pool.query(query, values);
      const departures = departuresResult.rows;

      return {
        data: departures,
        total,
        page,
        limit,
      };
    } catch (error) {
      throw error;
    }
  },

  getVisitorActivityForResident: async (residentId) => {
    try {
      const result = await pool.query(
        `
            SELECT va.*, pa.visitor_name, pa.arrival_time as expected_arrival_time
            FROM visitor_activity va
            LEFT JOIN pre_approvals pa ON va.pre_approval_id = pa.id
            WHERE pa.resident_id = $1
            ORDER BY va.arrival_time DESC
            `,
        [residentId]
      );
      return result.rows;
    } catch (error) {
      throw error;
    }
  },
};

module.exports = visitorsService;
