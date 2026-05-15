require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function applySchema() {
  const filePath = path.join(__dirname, '..', '..', 'sql', '01_schema.sql');
  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    await pool.query(sql);
    console.log('01_schema.sql başarıyla uygulandı.');
  } catch (err) {
    console.error('Schema uygulama hatası:', err.message || err);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

applySchema();
