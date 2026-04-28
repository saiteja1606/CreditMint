const express = require('express');
const { getTransactions, getWalletSummary, adjustBalance } = require('../controllers/walletController');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

router.use(authenticate);

router.get('/summary', getWalletSummary);
router.get('/transactions', getTransactions);
router.post('/adjust', adjustBalance);

module.exports = router;
