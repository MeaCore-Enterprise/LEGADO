const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET;
const TOKEN_COOKIE_NAME = 'token';
const TOKEN_EXPIRES_IN = '7d';
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;
const BCRYPT_ROUNDS = 10;

function createToken(userId) {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET no está definido en el entorno');
  }
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

function setAuthCookie(res, token) {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProduction,
    maxAge: TOKEN_MAX_AGE_MS,
  });
}

exports.register = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(409).json({ message: 'El email ya está registrado' });
    }

    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    const user = await User.create({
      email: email.toLowerCase().trim(),
      passwordHash,
    });

    const token = createToken(user._id.toString());
    setAuthCookie(res, token);

    return res.status(201).json({
      email: user.email,
    });
  } catch (err) {
    console.error('Error en registro:', err);
    return res.status(500).json({ message: 'Error en registro' });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ message: 'Email y password son requeridos' });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }

    const token = createToken(user._id.toString());
    setAuthCookie(res, token);

    return res.status(200).json({
      email: user.email,
    });
  } catch (err) {
    console.error('Error en login:', err);
    return res.status(500).json({ message: 'Error en login' });
  }
};
