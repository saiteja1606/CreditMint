const express = require('express');
const router = express.Router();
const { getLoans, getLoan, createLoan, updateLoan, deleteLoan, recordPayment, collectInterest } = require('../controllers/loanController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getLoans);
router.get('/:id', getLoan);
router.post('/', createLoan);
router.put('/:id', updateLoan);
router.delete('/:id', deleteLoan);
router.post('/:id/pay', recordPayment);
router.post('/:id/collect-interest', collectInterest);

module.exports = router;
