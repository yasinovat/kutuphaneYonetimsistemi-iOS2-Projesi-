const bcrypt = require('bcrypt');
const {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
} = require('../models/userModel');
const {
  createMember,
  updateMemberByEmail,
  deleteMemberByEmail
} = require('../models/memberModel');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

async function listUsers(req, res) {
  try {
    const users = await getAllUsers();
    return res.status(200).json(users);
  } catch (error) {
    return res.status(500).json({ message: 'Kullanicilar listelenirken hata olustu.', error: error.message });
  }
}

async function getUser(req, res) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: 'Gecerli bir kullanici id degeri gonderiniz.' });
    }

    const user = await getUserById(userId);

    if (!user) {
      return res.status(404).json({ message: 'Kullanici bulunamadi.' });
    }

    return res.status(200).json(user);
  } catch (error) {
    return res.status(500).json({ message: 'Kullanici getirilirken hata olustu.', error: error.message });
  }
}

async function addUser(req, res) {
  try {
    const { full_name, email, password } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'full_name, email ve password alanlari zorunludur.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await createUser({
      full_name,
      email,
      password_hash,
      role: 'member'
    });

    return res.status(201).json(newUser);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ayni email degerine sahip kullanici zaten var.' });
    }

    return res.status(500).json({ message: 'Kullanici eklenirken hata olustu.', error: error.message });
  }
}

async function editUser(req, res) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: 'Gecerli bir kullanici id degeri gonderiniz.' });
    }

    const { full_name, email, role, password } = req.body;

    if (!full_name && !email && !role && !password) {
      return res.status(400).json({ message: 'Guncellemek icin en az bir alan gonderiniz.' });
    }

    const password_hash = password ? await bcrypt.hash(password, SALT_ROUNDS) : null;

    const existingUser = await getUserById(userId);

    if (!existingUser) {
      return res.status(404).json({ message: 'Kullanici bulunamadi.' });
    }

    const safeRole = req.user.role === 'admin' ? role || null : null;

    const updatedUser = await updateUser({
      id: userId,
      full_name: full_name || null,
      email: email || null,
      role: safeRole,
      password_hash
    });

    if (!updatedUser) {
      return res.status(404).json({ message: 'Kullanici bulunamadi.' });
    }

    // members tablosu memeberların kendi yaptıkları işlemelere göre güncellenebilir
    const isSelfMemberUpdate = req.user.role === 'member' && req.user.id === userId && updatedUser.role === 'member';

    if (isSelfMemberUpdate) {
      const currentEmail = existingUser.email;

      const memberUpdated = await updateMemberByEmail({
        currentEmail,
        full_name: updatedUser.full_name,
        email: updatedUser.email,
        phone: null
      });

      if (!memberUpdated) {
        await createMember({
          full_name: updatedUser.full_name,
          email: updatedUser.email,
          phone: null
        });
      }
    }

    return res.status(200).json(updatedUser);
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ message: 'Ayni email degerine sahip kullanici zaten var.' });
    }

    return res.status(500).json({ message: 'Kullanici guncellenirken hata olustu.', error: error.message });
  }
}

async function removeUser(req, res) {
  try {
    const userId = Number(req.params.id);

    if (!Number.isInteger(userId)) {
      return res.status(400).json({ message: 'Gecerli bir kullanici id degeri gonderiniz.' });
    }

    const deletedUser = await deleteUser(userId);

    if (!deletedUser) {
      return res.status(404).json({ message: 'Kullanici bulunamadi.' });
    }

    const isSelfMemberDelete = req.user.role === 'member' && req.user.id === userId && deletedUser.role === 'member';

    if (isSelfMemberDelete) {
      await deleteMemberByEmail(deletedUser.email);
    }

    return res.status(200).json({ message: 'Kullanici silindi.', user: deletedUser });
  } catch (error) {
    return res.status(500).json({ message: 'Kullanici silinirken hata olustu.', error: error.message });
  }
}

module.exports = {
  listUsers,
  getUser,
  addUser,
  editUser,
  removeUser
};
