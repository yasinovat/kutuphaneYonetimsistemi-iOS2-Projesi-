const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getActiveLoansHandler,
  getAllLoansHandler,
  getLoanHandler,
  returnBookHandler,
  getOverdueCountHandler,
  getOverdueStatsHandler
} = require('../controllers/loansController');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// Specific routes MUST come before parametric routes
// Get overdue count for current user
router.get('/overdue/count', getOverdueCountHandler);

// Get overdue loans stats (admin only)
router.get('/overdue/stats', getOverdueStatsHandler);

// Get active loans for current user
router.get('/active', getActiveLoansHandler);

// Get all loans for current user (with filters)
router.get('/', getAllLoansHandler);

// Get single loan
router.get('/:id', getLoanHandler);

// Return a book
router.put('/:id/return', returnBookHandler);

module.exports = router;
