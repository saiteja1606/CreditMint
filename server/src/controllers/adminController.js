const { success } = require('../utils/apiResponse');
const { runDailyReminders } = require('../services/reminderService');

const runRemindersNow = async (req, res, next) => {
  try {
    const summary = await runDailyReminders();
    return success(res, summary, 'Reminders executed');
  } catch (err) {
    next(err);
  }
};

module.exports = { runRemindersNow };
