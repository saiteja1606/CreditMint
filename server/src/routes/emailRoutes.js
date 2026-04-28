const express = require('express');
const { authenticate } = require('../middleware/auth');
const { sendTestEmail } = require('../controllers/emailController');

const router = express.Router();

router.post('/test-email', authenticate, sendTestEmail);

module.exports = router;
