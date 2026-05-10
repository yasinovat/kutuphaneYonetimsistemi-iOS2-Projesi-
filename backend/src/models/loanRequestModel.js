const { pool } = require('../config/db');

async function getAllLoanRequests(filters = {}) {
  const whereClauses = [];
  const values = [];

  if (filters.status) {
    values.push(filters.status);
    whereClauses.push(`lr.status = $${values.length}`);
  }

  if (filters.memberId) {
    values.push(filters.memberId);
    whereClauses.push(`lr.member_id = $${values.length}`);
  }

  if (filters.bookId) {
    values.push(filters.bookId);
    whereClauses.push(`lr.book_id = $${values.length}`);
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    SELECT 
      lr.id, lr.book_id, lr.member_id, lr.request_date, lr.status,
      lr.note, lr.approved_by, lr.approval_date, lr.rejection_reason,
      lr.created_at,
      b.title AS book_title, b.author AS book_author,
      m.full_name AS member_name, m.email AS member_email,
      u.full_name AS approver_name
    FROM loan_requests lr
    LEFT JOIN books b ON lr.book_id = b.id
    LEFT JOIN members m ON lr.member_id = m.id
    LEFT JOIN users u ON lr.approved_by = u.id
    ${whereSql}
    ORDER BY lr.request_date DESC, lr.id DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

async function getLoanRequestById(id) {
  const query = `
    SELECT 
      lr.id, lr.book_id, lr.member_id, lr.request_date, lr.status,
      lr.note, lr.approved_by, lr.approval_date, lr.rejection_reason,
      lr.created_at,
      b.title AS book_title, b.author AS book_author, b.available_copies,
      m.full_name AS member_name, m.email AS member_email,
      u.full_name AS approver_name
    FROM loan_requests lr
    LEFT JOIN books b ON lr.book_id = b.id
    LEFT JOIN members m ON lr.member_id = m.id
    LEFT JOIN users u ON lr.approved_by = u.id
    WHERE lr.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
}

async function getLoanRequestsByMemberId(memberId) {
  const query = `
    SELECT 
      lr.id, lr.book_id, lr.member_id, lr.request_date, lr.status,
      lr.note, lr.approved_by, lr.approval_date, lr.rejection_reason,
      lr.created_at,
      b.title AS book_title, b.author AS book_author,
      m.full_name AS member_name
    FROM loan_requests lr
    LEFT JOIN books b ON lr.book_id = b.id
    LEFT JOIN members m ON lr.member_id = m.id
    WHERE lr.member_id = $1
    ORDER BY lr.request_date DESC
  `;

  const result = await pool.query(query, [memberId]);
  return result.rows;
}

async function createLoanRequest(bookId, memberId, note = null) {
  // Check if book exists and has copies
  const bookCheck = await pool.query(
    'SELECT id, title, available_copies FROM books WHERE id = $1',
    [bookId]
  );

  if (bookCheck.rows.length === 0) {
    throw new Error('Kitap bulunamadı.');
  }

  if (bookCheck.rows[0].available_copies <= 0) {
    throw new Error('Bu kitabın kopyası mevcut değil.');
  }

  // Check if member exists
  const memberCheck = await pool.query(
    'SELECT id, full_name FROM members WHERE id = $1',
    [memberId]
  );

  if (memberCheck.rows.length === 0) {
    throw new Error('Üye bulunamadı.');
  }

  // Check for duplicate pending request
  const duplicateCheck = await pool.query(
    'SELECT id FROM loan_requests WHERE book_id = $1 AND member_id = $2 AND status = $3',
    [bookId, memberId, 'pending']
  );

  if (duplicateCheck.rows.length > 0) {
    throw new Error('Bu kitap için zaten bekleyen bir istek var.');
  }

  const query = `
    INSERT INTO loan_requests (book_id, member_id, note, request_date)
    VALUES ($1, $2, $3, CURRENT_DATE)
    RETURNING id, book_id, member_id, request_date, status, note, created_at
  `;

  const result = await pool.query(query, [bookId, memberId, note]);
  return result.rows[0];
}

async function approveLoanRequest(loanRequestId, userId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get loan request details
    const loanReqQuery = `
      SELECT lr.id, lr.book_id, lr.member_id, lr.status
       FROM loan_requests lr
       WHERE lr.id = $1
    `;
    const loanReq = await client.query(loanReqQuery, [loanRequestId]);

    if (loanReq.rows.length === 0) {
      throw new Error('İstek bulunamadı.');
    }

    if (loanReq.rows[0].status !== 'pending') {
      throw new Error('Sadece bekleyen istekler onaylanabilir.');
    }

    // Validate book and member exist
    const bookCheck = await client.query(
       'SELECT b.id FROM books b WHERE b.id = $1',
      [loanReq.rows[0].book_id]
    );
    if (bookCheck.rows.length === 0) {
      throw new Error('Kitap bulunamadı.');
    }

    const memberCheck = await client.query(
       'SELECT m.id FROM members m WHERE m.id = $1',
      [loanReq.rows[0].member_id]
    );
    if (memberCheck.rows.length === 0) {
      throw new Error('Üye bulunamadı.');
    }

    // Update loan request status
    const updateQuery = `
      UPDATE loan_requests
      SET status = 'approved', approved_by = $1, approval_date = NOW()
      WHERE id = $2
      RETURNING id, status, approval_date
    `;
    const updatedReq = await client.query(updateQuery, [userId, loanRequestId]);

    // Create loan record with 14-day due date
    const loanQuery = `
      INSERT INTO loans (book_id, member_id, loan_date, due_date, status)
      VALUES ($1, $2, CURRENT_DATE, CURRENT_DATE + INTERVAL '14 days', 'borrowed')
      RETURNING id
    `;
    const newLoan = await client.query(loanQuery, [
      loanReq.rows[0].book_id,
      loanReq.rows[0].member_id
    ]);

    // Decrease available copies
    const updateCopiesQuery = `
      UPDATE books
      SET available_copies = available_copies - 1
      WHERE id = $1 AND available_copies > 0
    `;
    await client.query(updateCopiesQuery, [loanReq.rows[0].book_id]);

    await client.query('COMMIT');

    return {
      loanRequest: updatedReq.rows[0],
      loanId: newLoan.rows[0].id
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function rejectLoanRequest(loanRequestId, userId, rejectionReason = null) {
  const query = `
    UPDATE loan_requests
    SET status = 'rejected', approved_by = $1, approval_date = NOW(), rejection_reason = $2
    WHERE id = $3 AND status = 'pending'
    RETURNING id, status, rejection_reason, approval_date
  `;

  const result = await pool.query(query, [userId, rejectionReason, loanRequestId]);

  if (result.rows.length === 0) {
    throw new Error('İstek bulunamadı veya durumu değiştirilemez.');
  }

  return result.rows[0];
}

async function cancelLoanRequest(loanRequestId, memberId) {
  const query = `
    UPDATE loan_requests
    SET status = 'cancelled'
    WHERE id = $1 AND member_id = $2 AND status = 'pending'
    RETURNING id, status
  `;

  const result = await pool.query(query, [loanRequestId, memberId]);

  if (result.rows.length === 0) {
    throw new Error('İstek bulunamadı veya iptal edilemez.');
  }

  return result.rows[0];
}

async function getPendingLoanRequests() {
  return getAllLoanRequests({ status: 'pending' });
}

async function getLoanRequestStats() {
  const query = `
    SELECT 
      status,
      COUNT(*) as count
    FROM loan_requests
    GROUP BY status
  `;

  const result = await pool.query(query);
  return result.rows;
}

module.exports = {
  getAllLoanRequests,
  getLoanRequestById,
  getLoanRequestsByMemberId,
  createLoanRequest,
  approveLoanRequest,
  rejectLoanRequest,
  cancelLoanRequest,
  getPendingLoanRequests,
  getLoanRequestStats
};
