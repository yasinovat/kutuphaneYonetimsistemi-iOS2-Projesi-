const express = require('express');
const { verifyToken } = require('../middlewares/authMiddleware');
const {
  getAllLoanRequestsHandler,
  getLoanRequestDetailHandler,
  createLoanRequestHandler,
  getMyLoanRequestsHandler,
  getPendingLoanRequestsHandler,
  approveLoanRequestHandler,
  rejectLoanRequestHandler,
  cancelLoanRequestHandler,
  getLoanRequestStatsHandler
} = require('../controllers/loanRequestController');

const router = express.Router();

// All routes require authentication
router.use(verifyToken);

// GET /api/loan-requests/my-requests - Kullanıcının kendi istekleri
router.get('/my-requests', getMyLoanRequestsHandler);

// GET /api/loan-requests/pending - Bekleyen istekler (Admin only)
router.get('/pending', getPendingLoanRequestsHandler);

// GET /api/loan-requests/stats - İstek istatistikleri (Admin only)
router.get('/stats', getLoanRequestStatsHandler);

// POST /api/loan-requests - Yeni ödünç alma isteği oluşturma
router.post('/', createLoanRequestHandler);

// GET /api/loan-requests - Tüm istekler (Admin only)
router.get('/', getAllLoanRequestsHandler);

// GET /api/loan-requests/:id - İstek detayı
router.get('/:id', getLoanRequestDetailHandler);

// PUT /api/loan-requests/:id/approve - İsteği onaylama (Admin only)
router.put('/:id/approve', approveLoanRequestHandler);

// PUT /api/loan-requests/:id/reject - İsteği reddetme (Admin only)
router.put('/:id/reject', rejectLoanRequestHandler);

// PUT /api/loan-requests/:id/cancel - İsteği iptal etme (Kendi istekleri)
router.put('/:id/cancel', cancelLoanRequestHandler);

module.exports = router;
