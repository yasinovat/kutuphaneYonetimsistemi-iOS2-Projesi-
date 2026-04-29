require('dotenv').config();
const https = require('https');
const { pool } = require('../config/db');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        let raw = '';
        res.on('data', (chunk) => (raw += chunk));
        res.on('end', () => {
          try {
            const parsed = JSON.parse(raw);
            resolve(parsed);
          } catch (e) {
            reject(e);
          }
        });
      })
      .on('error', (err) => reject(err));
  });
}

async function findCoverForBook(book) {
  if (!book) return null;

  const isbn = book.isbn ? String(book.isbn).replace(/[^0-9Xx]/g, '') : null;

  const tryQuery = async (q) => {
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=1`;
    try {
      const data = await fetchJson(url);
      const item = data?.items?.[0];
      const thumbnail = item?.volumeInfo?.imageLinks?.thumbnail || item?.volumeInfo?.imageLinks?.smallThumbnail;
      return thumbnail ? thumbnail.replace('http://', 'https://') : null;
    } catch (e) {
      return null;
    }
  };

  if (isbn) {
    const byIsbn = await tryQuery(`isbn:${isbn}`);
    if (byIsbn) return byIsbn;
  }

  const titleAuthor = [book.title, book.author].filter(Boolean).join(' ');
  if (titleAuthor) {
    const byTitle = await tryQuery(`intitle:${book.title}+inauthor:${book.author}`);
    if (byTitle) return byTitle;
  }

  return null;
}

async function main() {
  try {
    const res = await pool.query(`SELECT id, title, author, isbn FROM books WHERE cover_url IS NULL OR cover_url = ''`);
    const rows = res.rows || [];

    console.log(`Found ${rows.length} books without cover_url`);

    for (const book of rows) {
      try {
        const cover = await findCoverForBook(book);
        if (cover) {
          await pool.query('UPDATE books SET cover_url = $1 WHERE id = $2', [cover, book.id]);
          console.log(`Updated book ${book.id} cover`);
        } else {
          console.log(`No cover found for ${book.id}`);
        }
        // delay eklemesi
        await new Promise((r) => setTimeout(r, 200));
      } catch (e) {
        console.error('Error for book', book.id, e.message || e);
      }
    }

    console.log('Done.');
    process.exit(0);
  } catch (e) {
    console.error('Fatal error', e.message || e);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}
