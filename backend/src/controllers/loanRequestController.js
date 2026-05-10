const {
  getAllLoanRequests,
  getLoanRequestById,
  getLoanRequestsByMemberId,
  createLoanRequest,
  approveLoanRequest,
  rejectLoanRequest,
  cancelLoanRequest,
  getPendingLoanRequests,
  getLoanRequestStats
} = require('../models/loanRequestModel');

async function getAllLoanRequestsHandler(req, res) {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkilendirme hatası.' });
    }

    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }
    if (req.query.memberId) {
      filters.memberId = parseInt(req.query.memberId);
    }
    if (req.query.bookId) {
      filters.bookId = parseInt(req.query.bookId);
    }

    const requests = await getAllLoanRequests(filters);
    return res.status(200).json(requests);
  } catch (error) {
    console.error('getAllLoanRequests error:', error.message);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

async function getLoanRequestDetailHandler(req, res) {
  try {
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Geçersiz istek ID\'si.' });
    }

    const request = await getLoanRequestById(requestId);

    if (!request) {
      return res.status(404).json({ error: 'İstek bulunamadı.' });
    }

    // User can only view own requests or admin can view all
    if (req.user.role !== 'admin' && request.member_id !== req.user.member_id) {
      return res.status(403).json({ error: 'Yetkilendirme hatası.' });
    }

    return res.status(200).json(request);
  } catch (error) {
    console.error('getLoanRequestDetail error:', error.message);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

async function createLoanRequestHandler(req, res) {
  try {
    const { bookId, note } = req.body;

    if (!bookId) {
      return res.status(400).json({ error: 'bookId zorunludur.' });
    }

    if (typeof bookId !== 'number') {
      return res.status(400).json({ error: 'bookId bir sayı olmalıdır.' });
    }

    if (!req.user.member_id) {
      return res.status(400).json({ error: 'Hesabınız bir üye ile bağlı değil.' });
    }

    const newRequest = await createLoanRequest(bookId, req.user.member_id, note || null);

    return res.status(201).json({
      message: 'Ödünç alma isteği oluşturuldu.',
      request: newRequest
    });
  } catch (error) {
    console.error('createLoanRequest error:', error.message);

    if (error.message.includes('bulunamadı') || error.message.includes('mevcut değil') || error.message.includes('zaten')) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

async function getMyLoanRequestsHandler(req, res) {
  try {
    if (!req.user.member_id) {
      return res.status(400).json({ error: 'Hesabınız bir üye ile bağlı değil.' });
    }

    const requests = await getLoanRequestsByMemberId(req.user.member_id);
    return res.status(200).json(requests);
  } catch (error) {
    console.error('getMyLoanRequests error:', error.message);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

async function getPendingLoanRequestsHandler(req, res) {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkilendirme hatası.' });
    }

    const requests = await getPendingLoanRequests();
    return res.status(200).json(requests);
  } catch (error) {
    console.error('getPendingLoanRequests error:', error.message);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

async function approveLoanRequestHandler(req, res) {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkilendirme hatası.' });
    }

    const requestId = parseInt(req.params.id);

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Geçersiz istek ID\'si.' });
    }

    const result = await approveLoanRequest(requestId, req.user.id);

    return res.status(200).json({
      message: 'İstek onaylandı.',
      loanRequest: result.loanRequest,
      loanId: result.loanId
    });
  } catch (error) {
    console.error('approveLoanRequest error:', error.message);
    console.error('approveLoanRequest details:', error);

    if (error.message.includes('bulunamadı') || error.message.includes('onaylanabilir')) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: error.message || 'Sunucu hatası.' });
  }
}

async function rejectLoanRequestHandler(req, res) {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkilendirme hatası.' });
    }

    const requestId = parseInt(req.params.id);
    const { rejectionReason } = req.body;

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Geçersiz istek ID\'si.' });
    }

    const updatedRequest = await rejectLoanRequest(requestId, req.user.id, rejectionReason || null);

    return res.status(200).json({
      message: 'İstek reddedildi.',
      request: updatedRequest
    });
  } catch (error) {
    console.error('rejectLoanRequest error:', error.message);

    if (error.message.includes('bulunamadı') || error.message.includes('değiştirilemez')) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

async function cancelLoanRequestHandler(req, res) {
  try {
    const requestId = parseInt(req.params.id);

    if (isNaN(requestId)) {
      return res.status(400).json({ error: 'Geçersiz istek ID\'si.' });
    }

    if (!req.user.member_id) {
      return res.status(400).json({ error: 'Hesabınız bir üye ile bağlı değil.' });
    }

    const updatedRequest = await cancelLoanRequest(requestId, req.user.member_id);

    return res.status(200).json({
      message: 'İstek iptal edildi.',
      request: updatedRequest
    });
  } catch (error) {
    console.error('cancelLoanRequest error:', error.message);

    if (error.message.includes('bulunamadı') || error.message.includes('iptal edilemez')) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

async function getLoanRequestStatsHandler(req, res) {
  try {
    // Admin only
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkilendirme hatası.' });
    }

    const stats = await getLoanRequestStats();
    return res.status(200).json(stats);
  } catch (error) {
    console.error('getLoanRequestStats error:', error.message);
    console.error('getLoanRequestStats details:', error);
    return res.status(500).json({ error: error.message || 'Sunucu hatası.' });
  }
}

module.exports = {
  getAllLoanRequestsHandler,
  getLoanRequestDetailHandler,
  createLoanRequestHandler,
  getMyLoanRequestsHandler,
  getPendingLoanRequestsHandler,
  approveLoanRequestHandler,
  rejectLoanRequestHandler,
  cancelLoanRequestHandler,
  getLoanRequestStatsHandler
};
