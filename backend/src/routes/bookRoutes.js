const express = require('express');
const {
	listBooks,
	getBook,
	addBook,
	editBook,
	removeBook
} = require('../controllers/bookController');
const { verifyToken, requireAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/books', verifyToken, listBooks);
router.get('/books/:id', verifyToken, getBook);
router.post('/books', verifyToken, requireAdmin, addBook);
router.put('/books/:id', verifyToken, requireAdmin, editBook);
router.delete('/books/:id', verifyToken, requireAdmin, removeBook);

module.exports = router;
