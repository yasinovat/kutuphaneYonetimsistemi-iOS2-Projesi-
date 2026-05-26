const express = require('express');
const { register, login, changePassword } = require('../controllers/authController');
const { verifyToken } = require('../middlewares/authMiddleware');

const router = express.Router();

router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/change-password', verifyToken, changePassword);

module.exports = router;
