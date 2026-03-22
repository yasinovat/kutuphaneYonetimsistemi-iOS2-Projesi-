require('dotenv').config();
const { Pool } = require('pg');

async function cleanupTodayMembers() {
  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'library_db'
  });

  try {
    const before = await pool.query(
      "SELECT id, full_name, email, role, created_at FROM users WHERE role = 'member' AND created_at::date = CURRENT_DATE ORDER BY id"
    );

    console.log(`today_member_count_before=${before.rowCount}`);

    if (before.rowCount === 0) {
      console.log('deleted_count=0');
      return;
    }

    const deleted = await pool.query(
      "DELETE FROM users WHERE role = 'member' AND created_at::date = CURRENT_DATE RETURNING id, email"
    );

    console.log(`deleted_count=${deleted.rowCount}`);
    console.log(JSON.stringify(deleted.rows));
  } catch (error) {
    console.error(`cleanup_error=${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

cleanupTodayMembers();
