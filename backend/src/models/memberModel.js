const { pool } = require('../config/db');

async function createMember({ full_name, email, phone = null }) {
  const query = `
    INSERT INTO members (full_name, email, phone)
    VALUES ($1, $2, $3)
    ON CONFLICT (email) DO NOTHING
    RETURNING id, full_name, email, phone, membership_date, created_at
  `;

  const result = await pool.query(query, [full_name, email, phone]);
  return result.rows[0] || null;
}

async function updateMemberByEmail({ currentEmail, full_name, email, phone = null }) {
  const query = `
    UPDATE members
    SET
      full_name = COALESCE($2, full_name),
      email = COALESCE($3, email),
      phone = COALESCE($4, phone)
    WHERE email = $1
    RETURNING id, full_name, email, phone, membership_date, created_at
  `;

  const result = await pool.query(query, [currentEmail, full_name, email, phone]);
  return result.rows[0] || null;
}

async function deleteMemberByEmail(email) {
  const query = `
    DELETE FROM members
    WHERE email = $1
    RETURNING id, full_name, email, phone, membership_date, created_at
  `;

  const result = await pool.query(query, [email]);
  return result.rows[0] || null;
}

module.exports = {
  createMember,
  updateMemberByEmail,
  deleteMemberByEmail
};
