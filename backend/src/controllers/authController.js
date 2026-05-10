const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { createUser, getUserByEmail } = require('../models/userModel');
const { createMember } = require('../models/memberModel');
const { JWT_SECRET, JWT_EXPIRES_IN } = require('../config/auth');

const SALT_ROUNDS = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;

function generateAuthToken(user) {
  return jwt.sign(
    {
      sub: user.id,
      email: user.email,
      role: user.role
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
}

async function register(req, res) {
  try {
    const { full_name, email, password, phone } = req.body;

    if (!full_name || !email || !password) {
      return res.status(400).json({ message: 'full_name, email ve password alanlari zorunludur.' });
    }

    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return res.status(409).json({ message: 'Bu email ile kayitli bir kullanici zaten var.' });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);

    const newUser = await createUser({
      full_name,
      email,
      password_hash,
      role: 'member'
    });

    const newMember = await createMember({
      full_name,
      email,
      phone: phone || null
    });

    // User'ı member ile bağla
    if (newMember && newUser) {
      const { updateUser } = require('../models/userModel');
      await updateUser({
        id: newUser.id,
        member_id: newMember.id
      });
      newUser.member_id = newMember.id;
    }

    const token = generateAuthToken(newUser);

    return res.status(201).json({
      message: 'Kayit basarili.',
      token,
      user: newUser
    });
  } catch (error) {
    return res.status(500).json({ message: 'Kayit sirasinda hata olustu.', error: error.message });
  }
}

async function login(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'email ve password alanlari zorunludur.' });
    }

    const user = await getUserByEmail(email);

    if (!user) {
      return res.status(401).json({ message: 'Email veya sifre hatali.' });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password_hash);

    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Email veya sifre hatali.' });
    }

    const token = generateAuthToken(user);

    return res.status(200).json({
      message: 'Giris basarili.',
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        member_id: user.member_id,
        created_at: user.created_at
      }
    });
  } catch (error) {
    return res.status(500).json({ message: 'Giris sirasinda hata olustu.', error: error.message });
  }
}

module.exports = {
  register,
  login
};
