require('dotenv').config();
const { pool } = require('../config/db');

(async () => {
  try {
    console.log('DB bağlantısı deneniyor...');
    await pool.query('SELECT 1');
    console.log('DB bağlantısı başarılı, admin sorgulanıyor...');
    const res = await pool.query("SELECT id,email,role,created_at FROM users WHERE email=$1", ['admin@example.com']);
    console.log('Sorgu sonucu:');
    console.log(JSON.stringify(res.rows, null, 2));
  } catch (err) {
    console.error('Hata:', err && err.message ? err.message : err);
  } finally {
    await pool.end();
  }
})();
