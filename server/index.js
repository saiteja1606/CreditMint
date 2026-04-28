require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const authRoutes = require('./src/routes/authRoutes');
const adminRoutes = require('./src/routes/adminRoutes');
const borrowerRoutes = require('./src/routes/borrowerRoutes');
const loanRoutes = require('./src/routes/loanRoutes');
const notificationRoutes = require('./src/routes/notificationRoutes');
const reportRoutes = require('./src/routes/reportRoutes');
const emailRoutes = require('./src/routes/emailRoutes');
const walletRoutes = require('./src/routes/walletRoutes');
const { errorHandler } = require('./src/middleware/errorHandler');
const { startReminderCron } = require('./src/cron/reminderCron');
const { verifyEmailConnection } = require('./src/services/emailService');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (process.env.NODE_ENV !== 'production') {
  app.use(morgan('dev'));
}

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api', emailRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\nCredit Mint API running on port ${PORT}`);
  console.log(`Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`Client URL  : ${process.env.CLIENT_URL || 'http://localhost:5173'}\n`);

  verifyEmailConnection()
    .then((result) => {
      if (result.ok) {
        console.log('[Email] SMTP connection verified successfully');
      } else if (result.skipped) {
        console.log('[Email] SMTP verification skipped: SMTP not configured');
      } else {
        console.error(`[Email] SMTP verification failed: ${result.reason}`);
      }
    })
    .catch((error) => {
      console.error('[Email] SMTP verification crashed:', error.message);
    });

  startReminderCron();
});

module.exports = app;
