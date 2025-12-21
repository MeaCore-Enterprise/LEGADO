const jwt = require('jsonwebtoken');

const TOKEN_COOKIE_NAME = 'token';

module.exports = function auth(req, res, next) {
  const token = req.cookies && req.cookies[TOKEN_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: 'No autenticado' });
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    console.error('JWT_SECRET no está definido en el entorno');
    return res.status(500).json({ message: 'Error de configuración' });
  }

  try {
    const decoded = jwt.verify(token, secret);
    req.userId = decoded.userId;
    return next();
  } catch (err) {
    console.error('Error al verificar token:', err.message);
    return res.status(401).json({ message: 'Token inválido' });
  }
};
