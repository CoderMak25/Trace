const cron = require('node-cron');
const axios = require('axios');

function startDeadlineNotifier() {
  // Run daily at 9:00 AM IST (3:30 AM UTC)
  cron.schedule('30 3 * * *', async () => {
    console.log('[CRON] Running deadline notification check...');
    try {
      const port = process.env.PORT || 5000;
      await axios.post(`http://localhost:${port}/api/notifications/deadline-check`);
      console.log('[CRON] Deadline check complete');
    } catch (err) {
      console.error('[CRON] Deadline check failed:', err.message);
    }
  });
  console.log('[CRON] Deadline notifier scheduled for 9:00 AM IST daily');
}

module.exports = startDeadlineNotifier;
