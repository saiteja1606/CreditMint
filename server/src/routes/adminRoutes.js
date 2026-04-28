const express = require('express');
const { authenticate } = require('../middleware/auth');
const { runRemindersNow } = require('../controllers/adminController');

const router = express.Router();

router.use(authenticate);

router.post('/run-reminders', runRemindersNow);

module.exports = router;
