const { pool } = require('../config/db');

async function getAllUsers() {
  const query = `
    SELECT id, full_name, email, role, created_at
    FROM users
    ORDER BY id ASC
  `;

  const result = await pool.query(query);
  return result.rows;
}

async function getUserById(id) {
  const query = `
    SELECT id, full_name, email, role, created_at
    FROM users
    WHERE id = $1
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

async function getUserByEmail(email) {
  const query = `
    SELECT id, full_name, email, password_hash, role, created_at
    FROM users
    WHERE email = $1
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

async function createUser({ full_name, email, password_hash, role }) {
  const query = `
    INSERT INTO users (full_name, email, password_hash, role)
    VALUES ($1, $2, $3, $4)
    RETURNING id, full_name, email, role, created_at
  `;

  const values = [full_name, email, password_hash, role || 'member'];
  const result = await pool.query(query, values);
  return result.rows[0];
}

async function updateUser({ id, full_name, email, role, password_hash }) {
  const query = `
    UPDATE users
    SET
      full_name = COALESCE($2, full_name),
      email = COALESCE($3, email),
      role = COALESCE($4, role),
      password_hash = COALESCE($5, password_hash)
    WHERE id = $1
    RETURNING id, full_name, email, role, created_at
  `;

  const values = [id, full_name, email, role, password_hash];
  const result = await pool.query(query, values);
  return result.rows[0] || null;
}

async function deleteUser(id) {
  const query = `
    DELETE FROM users
    WHERE id = $1
    RETURNING id, full_name, email, role, created_at
  `;

  const result = await pool.query(query, [id]);
  return result.rows[0] || null;
}

module.exports = {
  getAllUsers,
  getUserById,
  getUserByEmail,
  createUser,
  updateUser,
  deleteUser
};
