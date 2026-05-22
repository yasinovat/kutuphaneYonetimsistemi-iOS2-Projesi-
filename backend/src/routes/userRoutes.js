const express = require('express');
const {
  listUsers,
  getUser,
  addUser,
  editUser,
  removeUser,
  toggleUserStatus
} = require('../controllers/userController');
const { verifyToken, requireAdmin, requireSelfOrAdmin } = require('../middlewares/authMiddleware');

const router = express.Router();

router.use(verifyToken);

router.get('/users', requireAdmin, listUsers);
router.post('/users', requireAdmin, addUser);
router.get('/users/:id', requireSelfOrAdmin, getUser);
router.put('/users/:id', requireSelfOrAdmin, editUser);
router.delete('/users/:id', requireSelfOrAdmin, removeUser);
router.put('/users/:id/toggle-status', requireAdmin, toggleUserStatus);

module.exports = router;
