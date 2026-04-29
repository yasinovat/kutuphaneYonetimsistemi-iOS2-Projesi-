const { pool } = require('../config/db');

async function getAllBooks(filters = {}) {
  const whereClauses = [];
  const values = [];

  if (filters.search) {
    values.push(`%${filters.search}%`);
    const searchParamIndex = values.length;
    whereClauses.push(`(title ILIKE $${searchParamIndex} OR author ILIKE $${searchParamIndex} OR genre ILIKE $${searchParamIndex})`);
  }

  if (filters.title) {
    values.push(`%${filters.title}%`);
    whereClauses.push(`title ILIKE $${values.length}`);
  }

  if (filters.author) {
    values.push(`%${filters.author}%`);
    whereClauses.push(`author ILIKE $${values.length}`);
  }

  if (filters.genre) {
    values.push(`%${filters.genre}%`);
    whereClauses.push(`genre ILIKE $${values.length}`);
  }

  if (filters.inStock === true) {
    whereClauses.push('available_copies > 0');
  }

  const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const query = `
    SELECT id, title, author, genre, isbn, published_year, total_copies, available_copies, cover_url, created_at
    FROM books
    ${whereSql}
    ORDER BY id ASC
  `;

  const result = await pool.query(query, values);
  return result.rows;
}

async function getBookById(id) {
  const query = `
    SELECT id, title, author, genre, isbn, published_year, total_copies, available_copies, cover_url, created_at
    FROM books
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

async function getActiveLoanCountByBookId(bookId) {
  const query = `
    SELECT COUNT(*)::INT AS active_loan_count
    FROM loans
    WHERE book_id = $1
      AND (status = 'borrowed' OR return_date IS NULL)
  `;

  const result = await pool.query(query, [bookId]);
  return result.rows[0]?.active_loan_count || 0;
}

async function createBook({ title, author, genre, isbn, published_year, total_copies, available_copies, cover_url = null }) {
  const query = `
    INSERT INTO books (title, author, genre, isbn, published_year, total_copies, available_copies, cover_url)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING id, title, author, genre, isbn, published_year, total_copies, available_copies, cover_url, created_at
  `;

  const values = [
    title,
    author,
    genre,
    isbn,
    published_year,
    total_copies,
    available_copies,
    cover_url
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

async function updateBook({ id, title, author, genre, isbn, published_year, total_copies, available_copies, cover_url }) {
  const query = `
    UPDATE books
    SET
      title = COALESCE($2, title),
      author = COALESCE($3, author),
      genre = COALESCE($4, genre),
      isbn = COALESCE($5, isbn),
      published_year = COALESCE($6, published_year),
      total_copies = COALESCE($7, total_copies),
      available_copies = COALESCE($8, available_copies),
      cover_url = COALESCE($9, cover_url)
    WHERE id = $1
    RETURNING id, title, author, genre, isbn, published_year, total_copies, available_copies, cover_url, created_at
  `;

  const values = [id, title, author, genre, isbn, published_year, total_copies, available_copies, cover_url];
  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

async function deleteBook(id) {
  const query = `
    DELETE FROM books
    WHERE id = $1
    RETURNING id, title, author, genre, isbn, published_year, total_copies, available_copies, cover_url, created_at
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

module.exports = {
  getAllBooks,
  getBookById,
  getActiveLoanCountByBookId,
  createBook,
  updateBook,
  deleteBook
};
