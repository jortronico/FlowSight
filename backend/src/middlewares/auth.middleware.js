const jwt = require('jsonwebtoken');
const db = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'flowsight_secret_key';

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    // Verificar que el usuario existe
    const [users] = await db.execute(
      'SELECT id, email, name, role, is_active FROM users WHERE id = ?',
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado'
      });
    }

    if (!users[0].is_active) {
      return res.status(403).json({
        success: false,
        message: 'Cuenta desactivada'
      });
    }

    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expirado'
      });
    }
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

const adminMiddleware = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de administrador'
    });
  }
  next();
};

const operatorMiddleware = (req, res, next) => {
  if (!['admin', 'operator'].includes(req.user.role)) {
    return res.status(403).json({
      success: false,
      message: 'Acceso denegado. Se requieren permisos de operador'
    });
  }
  next();
};

module.exports = { authMiddleware, adminMiddleware, operatorMiddleware };

