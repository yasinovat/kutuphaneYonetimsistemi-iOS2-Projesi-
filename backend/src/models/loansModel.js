const { pool } = require('../config/db');

// Get all active loans for a member
async function getActiveLoansByMemberId(memberId) {
  const query = `
    SELECT 
      l.id, l.book_id, l.member_id, l.loan_date, l.due_date, l.return_date, l.status,
      b.title AS book_title, b.author AS book_author, b.cover_url,
      CURRENT_DATE > l.due_date AND l.return_date IS NULL AS is_overdue,
      (CURRENT_DATE - l.due_date) AS days_overdue
    FROM loans l
    LEFT JOIN books b ON l.book_id = b.id
    WHERE l.member_id = $1 AND l.status = 'borrowed'
    ORDER BY l.due_date ASC
  `;

  const result = await pool.query(query, [memberId]);
  return result.rows;
}

// Get all loans for a member (including returned)
async function getAllLoansByMemberId(memberId, filters = {}) {
  const whereClauses = ['l.member_id = $1'];
  const values = [memberId];

  if (filters.status) {
    values.push(filters.status);
    whereClauses.push(`l.status = $${values.length}`);
  }

  const whereSql = whereClauses.join(' AND ');

  const query = `
    SELECT 
      l.id, l.book_id, l.member_id, l.loan_date, l.due_date, l.return_date, l.status,
      b.title AS book_title, b.author AS book_author, b.cover_url,
      CURRENT_DATE > l.due_date AND l.return_date IS NULL AS is_overdue,
      (CURRENT_DATE - l.due_date) AS days_overdue
    FROM loans l
    LEFT JOIN books b ON l.book_id = b.id
    WHERE ${whereSql}
    ORDER BY l.loan_date DESC
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

// Get loan by ID
async function getLoanById(id) {
  const query = `
    SELECT 
      l.id, l.book_id, l.member_id, l.loan_date, l.due_date, l.return_date, l.status,
      b.title AS book_title, b.author AS book_author, b.cover_url,
      m.full_name AS member_name,
      CURRENT_DATE > l.due_date AND l.return_date IS NULL AS is_overdue,
      (CURRENT_DATE - l.due_date) AS days_overdue
    FROM loans l
    LEFT JOIN books b ON l.book_id = b.id
    LEFT JOIN members m ON l.member_id = m.id
    WHERE l.id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0];
}

// Return a book
async function returnBook(loanId, memberId) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get loan details
    const loanQuery = `
      SELECT id, book_id, member_id, status FROM loans WHERE id = $1
    `;
    const loanResult = await client.query(loanQuery, [loanId]);

    if (loanResult.rows.length === 0) {
      throw new Error('Ödünç kaydı bulunamadı.');
    }

    const loan = loanResult.rows[0];

    if (loan.member_id !== memberId) {
      throw new Error('Bu ödünç kaydını iade edemezsiniz.');
    }

    if (loan.status !== 'borrowed') {
      throw new Error('Sadece ödünç alınan kitaplar iade edilebilir.');
    }

    // Update loan status and return date
    const updateLoanQuery = `
      UPDATE loans
      SET status = 'returned', return_date = CURRENT_DATE
      WHERE id = $1
      RETURNING id, status, return_date
    `;
    const updatedLoan = await client.query(updateLoanQuery, [loanId]);

    // Increase available copies
    const updateBooksQuery = `
      UPDATE books
      SET available_copies = available_copies + 1
      WHERE id = $1
    `;
    await client.query(updateBooksQuery, [loan.book_id]);

    await client.query('COMMIT');

    return updatedLoan.rows[0];
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get overdue loans count for a member
async function getOverdueLoansCount(memberId) {
  const query = `
    SELECT COUNT(*) as count
    FROM loans
    WHERE member_id = $1 AND status = 'borrowed' AND due_date < CURRENT_DATE
  `;

  const result = await pool.query(query, [memberId]);
  return result.rows[0].count;
}

// Get overdue loans stats (admin)
async function getOverdueLoansStats() {
  const query = `
    SELECT 
      l.member_id,
      m.full_name,
      m.email,
      COUNT(*) as overdue_count,
      MIN(l.due_date) as earliest_due_date
    FROM loans l
    JOIN members m ON l.member_id = m.id
    WHERE l.status = 'borrowed' AND l.due_date < CURRENT_DATE
    GROUP BY l.member_id, m.full_name, m.email
    ORDER BY overdue_count DESC
  `;

  const result = await pool.query(query);
  return result.rows;
}

module.exports = {
  getActiveLoansByMemberId,
  getAllLoansByMemberId,
  getLoanById,
  returnBook,
  getOverdueLoansCount,
  getOverdueLoansStats
};
