const {
  getAllBooks,
  getBookById,
  getActiveLoanCountByBookId,
  createBook,
  updateBook,
  deleteBook
} = require('../models/bookModel');

function parseBoolean(value) {
  if (typeof value !== 'string') {
    return null;
  }

  if (value.toLowerCase() === 'true') {
    return true;
  }

  if (value.toLowerCase() === 'false') {
    return false;
  }

  return null;
}

function parseOptionalInteger(value) {
  if (value === undefined || value === null || value === '') {
    return null;
  }

  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : NaN;
}

function validateStock(totalCopies, availableCopies, activeLoanCount = 0) {
  if (!Number.isInteger(totalCopies) || totalCopies <= 0) {
    return 'total_copies pozitif bir tam sayi olmalidir.';
  }

  if (!Number.isInteger(availableCopies) || availableCopies < 0) {
    return 'available_copies sifir veya pozitif bir tam sayi olmalidir.';
  }

  if (availableCopies > totalCopies) {
    return 'available_copies degeri total_copies degerinden buyuk olamaz.';
  }

  const maxAvailableByLoans = totalCopies - activeLoanCount;

  if (availableCopies > maxAvailableByLoans) {
    return 'Mevcut oduncteki kitaplar nedeniyle available_copies degeri gecersiz.';
  }

  return null;
}

async function listBooks(req, res) {
  try {
    const inStock = parseBoolean(req.query.inStock);

    if (req.query.inStock !== undefined && inStock === null) {
      return res.status(400).json({ message: 'inStock parametresi true veya false olmalidir.' });
    }

    const filters = {
      search: typeof req.query.search === 'string' ? req.query.search.trim() : null,
      title: typeof req.query.title === 'string' ? req.query.title.trim() : null,
      author: typeof req.query.author === 'string' ? req.query.author.trim() : null,
      genre: typeof req.query.genre === 'string' ? req.query.genre.trim() : null,
      inStock
    };

    const books = await getAllBooks(filters);
    return res.status(200).json(books);
  } catch (error) {
    return res.status(500).json({ message: 'Kitaplar listelenirken hata olustu.', error: error.message });
  }
}

async function getBook(req, res) {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId)) {
      return res.status(400).json({ message: 'Gecerli bir kitap id degeri gonderiniz.' });
    }

    const book = await getBookById(bookId);

    if (!book) {
      return res.status(404).json({ message: 'Kitap bulunamadi.' });
    }

    return res.status(200).json(book);
  } catch (error) {
    return res.status(500).json({ message: 'Kitap detayi getirilirken hata olustu.', error: error.message });
  }
}

async function addBook(req, res) {
  try {
    const {
      title,
      author,
      genre,
      isbn,
      published_year,
        total_copies,
        available_copies,
        cover_url
    } = req.body;

    if (!title || !author || !genre || !isbn) {
      return res.status(400).json({ message: 'title, author, genre ve isbn alanlari zorunludur.' });
    }

    const parsedPublishedYear = parseOptionalInteger(published_year);
    const parsedTotalCopies = parseOptionalInteger(total_copies ?? 1);
    const parsedAvailableCopies = parseOptionalInteger(available_copies ?? total_copies ?? 1);

    if (Number.isNaN(parsedPublishedYear) && published_year !== undefined) {
      return res.status(400).json({ message: 'published_year tam sayi olmalidir.' });
    }

    if (Number.isNaN(parsedTotalCopies) || Number.isNaN(parsedAvailableCopies)) {
      return res.status(400).json({ message: 'total_copies ve available_copies tam sayi olmalidir.' });
    }

    const stockError = validateStock(parsedTotalCopies, parsedAvailableCopies, 0);

    if (stockError) {
      return res.status(400).json({ message: stockError });
    }

    const newBook = await createBook({
      title,
      author,
      genre,
      isbn,
      published_year: parsedPublishedYear,
      total_copies: parsedTotalCopies,
      available_copies: parsedAvailableCopies,
      cover_url
    });

    return res.status(201).json(newBook);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ayni ISBN degerine sahip kitap zaten var.' });
    }

    return res.status(500).json({ message: 'Kitap eklenirken hata olustu.', error: error.message });
  }
}

async function editBook(req, res) {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId)) {
      return res.status(400).json({ message: 'Gecerli bir kitap id degeri gonderiniz.' });
    }

    const {
      title,
      author,
      genre,
      isbn,
      published_year,
      total_copies,
      available_copies,
      cover_url
    } = req.body;

    if (
      title === undefined
      && author === undefined
      && genre === undefined
      && isbn === undefined
      && published_year === undefined
      && total_copies === undefined
      && available_copies === undefined
    ) {
      return res.status(400).json({ message: 'Guncellemek icin en az bir alan gonderiniz.' });
    }

    const existingBook = await getBookById(bookId);

    if (!existingBook) {
      return res.status(404).json({ message: 'Kitap bulunamadi.' });
    }

    const parsedPublishedYear = parseOptionalInteger(published_year);
    const parsedTotalCopies = parseOptionalInteger(total_copies);
    const parsedAvailableCopies = parseOptionalInteger(available_copies);

    if (Number.isNaN(parsedPublishedYear) && published_year !== undefined) {
      return res.status(400).json({ message: 'published_year tam sayi olmalidir.' });
    }

    if (Number.isNaN(parsedTotalCopies) || Number.isNaN(parsedAvailableCopies)) {
      return res.status(400).json({ message: 'total_copies ve available_copies tam sayi olmalidir.' });
    }

    const nextTotalCopies = parsedTotalCopies ?? existingBook.total_copies;
    const nextAvailableCopies = parsedAvailableCopies ?? existingBook.available_copies;
    const activeLoanCount = await getActiveLoanCountByBookId(bookId);

    const stockError = validateStock(nextTotalCopies, nextAvailableCopies, activeLoanCount);

    if (stockError) {
      return res.status(400).json({ message: stockError });
    }

    const updatedBook = await updateBook({
      id: bookId,
      title: title ?? null,
      author: author ?? null,
      genre: genre ?? null,
      isbn: isbn ?? null,
      published_year: parsedPublishedYear,
      total_copies: parsedTotalCopies,
      available_copies: parsedAvailableCopies,
      cover_url: cover_url ?? undefined
    });

    if (!updatedBook) {
      return res.status(404).json({ message: 'Kitap bulunamadi.' });
    }

    return res.status(200).json(updatedBook);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ayni ISBN degerine sahip kitap zaten var.' });
    }

    return res.status(500).json({ message: 'Kitap guncellenirken hata olustu.', error: error.message });
  }
}

async function removeBook(req, res) {
  try {
    const bookId = Number(req.params.id);

    if (!Number.isInteger(bookId)) {
      return res.status(400).json({ message: 'Gecerli bir kitap id degeri gonderiniz.' });
    }

    const activeLoanCount = await getActiveLoanCountByBookId(bookId);

    if (activeLoanCount > 0) {
      return res.status(409).json({ message: 'Oduncte olan kitaplar varken kitap silinemez.' });
    }

    const deletedBook = await deleteBook(bookId);

    if (!deletedBook) {
      return res.status(404).json({ message: 'Kitap bulunamadi.' });
    }

    return res.status(200).json({ message: 'Kitap silindi.', book: deletedBook });
  } catch (error) {
    return res.status(500).json({ message: 'Kitap silinirken hata olustu.', error: error.message });
  }
}

module.exports = {
  listBooks,
  getBook,
  addBook,
  editBook,
  removeBook
};
