const express = require('express');
const router = express.Router();
const { getBorrowers, getBorrower, createBorrower, updateBorrower, deleteBorrower } = require('../controllers/borrowerController');
const { authenticate } = require('../middleware/auth');

router.use(authenticate);

router.get('/', getBorrowers);
router.get('/:id', getBorrower);
router.post('/', createBorrower);
router.put('/:id', updateBorrower);
router.delete('/:id', deleteBorrower);

module.exports = router;
