const cron = require('node-cron');
const pool = require('../config/database'); // Adjust path as needed
const dayjs = require('dayjs');

// Schedule a task to run every day at midnight
cron.schedule(
  '0 0 * * *',
  async () => {
    console.log('Running expired pre-approval deletion job...');

    try {
      const cutoffTime = dayjs().subtract(1, 'day').toDate(); // Calculate the cutoff time

      const result = await pool.query('DELETE FROM pre_approvals WHERE arrival_time < $1', [cutoffTime]);

      console.log(`Deleted ${result.rowCount} expired pre-approvals.`);
    } catch (error) {
      console.error('Error deleting expired pre-approvals:', error);
    }
  },
  {
    scheduled: true,
    timezone: 'Asia/Kolkata', // Set your timezone
  }
);
