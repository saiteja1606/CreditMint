const cron = require('node-cron');
const { runDailyReminders } = require('../services/reminderService');

const startReminderCron = () => {
  // Run daily at 9:00 AM
  cron.schedule('0 9 * * *', async () => {
    console.log('[Cron] Daily reminder job triggered at', new Date().toISOString());
    try {
      await runDailyReminders();
    } catch (err) {
      console.error('[Cron] Job failed:', err.message);
    }
  }, {
    timezone: 'Asia/Kolkata',
  });

  console.log('[Cron] Daily reminder scheduler started (runs at 9:00 AM IST)');
};

module.exports = { startReminderCron };
