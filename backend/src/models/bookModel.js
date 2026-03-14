const { pool } = require('../config/db');

async function getAllBooks() {
  const query = `
    SELECT id, title, author, isbn, published_year, total_copies, available_copies, created_at
    FROM books
    ORDER BY id ASC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function createBook({ title, author, isbn, published_year, total_copies, available_copies }) {
  const query = `
    INSERT INTO books (title, author, isbn, published_year, total_copies, available_copies)
    VALUES ($1, $2, $3, $4, $5, $6)
    RETURNING id, title, author, isbn, published_year, total_copies, available_copies, created_at
  `;

  const values = [
    title,
    author,
    isbn,
    published_year,
    total_copies,
    available_copies
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
}

module.exports = {
  getAllBooks,
  createBook
};
