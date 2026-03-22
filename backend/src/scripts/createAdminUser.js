require('dotenv').config();
const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

async function createOrPromoteAdmin() {
  const [, , fullNameArg, emailArg, passwordArg] = process.argv;

  if (!fullNameArg || !emailArg || !passwordArg) {
    console.error('Kullanim: node src/scripts/createAdminUser.js "Ad Soyad" email@example.com Sifre123!');
    process.exitCode = 1;
    return;
  }

  const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'library_db'
  });

  try {
    const existing = await pool.query(
      'SELECT id, full_name, email, role FROM users WHERE email = $1',
      [emailArg]
    );

    const passwordHash = await bcrypt.hash(passwordArg, SALT_ROUNDS);

    if (existing.rowCount > 0) {
      const updated = await pool.query(
        `
        UPDATE users
        SET full_name = $2, password_hash = $3, role = 'admin'
        WHERE email = $1
        RETURNING id, full_name, email, role, created_at
        `,
        [emailArg, fullNameArg, passwordHash]
      );

      console.log('Mevcut kullanici admin olarak guncellendi.');
      console.log(JSON.stringify(updated.rows[0]));
      return;
    }

    const inserted = await pool.query(
      `
      INSERT INTO users (full_name, email, password_hash, role)
      VALUES ($1, $2, $3, 'admin')
      RETURNING id, full_name, email, role, created_at
      `,
      [fullNameArg, emailArg, passwordHash]
    );

    console.log('Yeni admin kullanici olusturuldu.');
    console.log(JSON.stringify(inserted.rows[0]));
  } catch (error) {
    console.error(`admin_create_error=${error.message}`);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
}

createOrPromoteAdmin();
