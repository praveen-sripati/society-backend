const cron = require('node-cron');
const { pool } = require('../config/database'); // Adjust path to your database connection
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc'); // Import the utc plugin
dayjs.extend(utc);

// Schedule a task to run every hour at the 0th minute
cron.schedule(
  '0 * * * *',
  async () => {
    console.log('Running expired pre-approval update job (hourly)...');

    try {
      const nowUtc = dayjs.utc().toDate(); // Current time in UTC
      const result = await pool.query(
        `
            UPDATE pre_approvals
            SET status = 'expired'
            WHERE arrival_time < $1 AND status = 'pending'
        `,
        [nowUtc]
      );

      console.log(`Updated ${result.rowCount} pre-approvals.`);
    } catch (error) {
      console.error('Error updating expired pre-approvals:', error);
    }
  },
  {
    scheduled: true,
    timezone: 'Asia/Kolkata', // Set your timezone!
  }
);
