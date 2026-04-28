const express = require('express');
const router = express.Router();
const { getSummary, getMonthly, exportCSV, getBorrowerWise } = require('../controllers/reportController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/summary', getSummary);
router.get('/monthly', getMonthly);
router.get('/export', exportCSV);
router.get('/borrower-wise', getBorrowerWise);

module.exports = router;
