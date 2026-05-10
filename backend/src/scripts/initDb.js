require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { pool } = require('../config/db');

async function runSqlFile(fileName) {
  const filePath = path.join(__dirname, '..', '..', 'sql', fileName);
  const sql = fs.readFileSync(filePath, 'utf8');
  await pool.query(sql);
  console.log(`${fileName} uygulandi.`);
}

async function cleanupDb() {
  try {
    console.log('Mevcut tablolar temizleniyor...');
    await pool.query(`
      DROP TABLE IF EXISTS loan_requests CASCADE;
      DROP TABLE IF EXISTS loans CASCADE;
      DROP TABLE IF EXISTS books CASCADE;
      DROP TABLE IF EXISTS users CASCADE;
      DROP TABLE IF EXISTS members CASCADE;
    `);
    console.log('Tablolar temizlendi.');
  } catch (error) {
    console.error('Cleanup hatasi:', error.message);
  }
}

async function initDb() {
  try {
    // Önce mevcut tabloları sil
    await cleanupDb();
    
    // Sonra yeni tabloları oluştur
    await runSqlFile('01_schema.sql');
    await runSqlFile('02_seed_books.sql');
    console.log('Veritabani hazir.');
  } catch (error) {
    console.error('DB init hatasi:', error.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

initDb();
