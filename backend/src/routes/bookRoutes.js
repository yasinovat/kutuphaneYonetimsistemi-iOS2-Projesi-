const express = require('express');
const { listBooks, addBook } = require('../controllers/bookController');

const router = express.Router();

router.get('/books', listBooks);
router.post('/books', addBook);

module.exports = router;
