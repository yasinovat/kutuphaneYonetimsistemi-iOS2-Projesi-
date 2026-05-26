const {
  getActiveLoansByMemberId,
  getAllLoansByMemberId,
  getLoanById,
  returnBook,
  getOverdueLoansCount,
  getOverdueLoansStats
} = require('../models/loansModel');

// Get active loans for current user
async function getActiveLoansHandler(req, res) {
  try {
    if (!req.user.member_id) {
      return res.status(400).json({ error: 'Hesabınız bir üye ile bağlı değil.' });
    }

    const loans = await getActiveLoansByMemberId(req.user.member_id);
    return res.status(200).json(loans);
  } catch (error) {
    console.error('getActiveLoans error:', error.message);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// Get all loans for current user (including returned)
async function getAllLoansHandler(req, res) {
  try {
    if (!req.user.member_id) {
      return res.status(400).json({ error: 'Hesabınız bir üye ile bağlı değil.' });
    }

    const filters = {};
    if (req.query.status) {
      filters.status = req.query.status;
    }

    const loans = await getAllLoansByMemberId(req.user.member_id, filters);
    return res.status(200).json(loans);
  } catch (error) {
    console.error('getAllLoans error:', error.message);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// Get single loan
async function getLoanHandler(req, res) {
  try {
    const loanId = parseInt(req.params.id);

    if (isNaN(loanId)) {
      return res.status(400).json({ error: 'Geçersiz ödünç ID\'si.' });
    }

    const loan = await getLoanById(loanId);

    if (!loan) {
      return res.status(404).json({ error: 'Ödünç kaydı bulunamadı.' });
    }

    // User can only view own loans or admin can view all
    if (req.user.role !== 'admin' && loan.member_id !== req.user.member_id) {
      return res.status(403).json({ error: 'Yetkilendirme hatası.' });
    }

    return res.status(200).json(loan);
  } catch (error) {
    console.error('getLoan error:', error.message);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// Return a book
async function returnBookHandler(req, res) {
  try {
    const loanId = parseInt(req.params.id);

    if (isNaN(loanId)) {
      return res.status(400).json({ error: 'Geçersiz ödünç ID\'si.' });
    }

    if (!req.user.member_id) {
      return res.status(400).json({ error: 'Hesabınız bir üye ile bağlı değil.' });
    }

    const result = await returnBook(loanId, req.user.member_id);

    return res.status(200).json({
      message: 'Kitap başarıyla iade edildi.',
      loan: result
    });
  } catch (error) {
    console.error('returnBook error:', error.message);

    if (error.message.includes('bulunamadı') || error.message.includes('iade edemez') || error.message.includes('ödünç alınan')) {
      return res.status(400).json({ error: error.message });
    }

    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// Get overdue count for current user
async function getOverdueCountHandler(req, res) {
  try {
    if (!req.user.member_id) {
      return res.status(400).json({ error: 'Hesabınız bir üye ile bağlı değil.' });
    }

    const count = await getOverdueLoansCount(req.user.member_id);
    return res.status(200).json({ overdue_count: count });
  } catch (error) {
    console.error('getOverdueCount error:', error.message);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

// Get overdue loans stats (admin only)
async function getOverdueStatsHandler(req, res) {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Yetkilendirme hatası.' });
    }

    const stats = await getOverdueLoansStats();
    return res.status(200).json(stats);
  } catch (error) {
    console.error('getOverdueStats error:', error.message);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
}

module.exports = {
  getActiveLoansHandler,
  getAllLoansHandler,
  getLoanHandler,
  returnBookHandler,
  getOverdueCountHandler,
  getOverdueStatsHandler
};
