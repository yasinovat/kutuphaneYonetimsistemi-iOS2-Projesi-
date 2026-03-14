const { getAllBooks, createBook } = require('../models/bookModel');

async function listBooks(req, res) {
  try {
    const books = await getAllBooks();
    return res.status(200).json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Kitaplar listelenirken hata olustu.', error: error.message });
  }
}

async function addBook(req, res) {
  try {
    const { title, author, isbn, published_year, total_copies, available_copies } = req.body;

    if (!title || !author || !isbn) {
      return res.status(400).json({ message: 'title, author ve isbn alanlari zorunludur.' });
    }

    const newBook = await createBook({
      title,
      author,
      isbn,
      published_year: published_year ?? null,
      total_copies: total_copies ?? 1,
      available_copies: available_copies ?? total_copies ?? 1
    });

    return res.status(201).json(newBook);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ayni ISBN degerine sahip kitap zaten var.' });
    }

    return res.status(500).json({ message: 'Kitap eklenirken hata olustu.', error: error.message });
  }
}

module.exports = {
  listBooks,
  addBook
};
