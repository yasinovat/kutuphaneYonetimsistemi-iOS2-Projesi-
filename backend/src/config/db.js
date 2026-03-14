const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'library_db'
});

async function connectDB() {
  await pool.query('SELECT 1');
  console.log('PostgreSQL baglantisi basarili.');
}

module.exports = {
  pool,
  connectDB
};
