const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/auth.controller');
const { authMiddleware } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validate.middleware');

const router = express.Router();

// Login
router.post('/login', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').notEmpty().withMessage('Contraseña requerida'),
  validateRequest
], authController.login);

// Registro
router.post('/register', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('name').notEmpty().withMessage('Nombre requerido'),
  validateRequest
], authController.register);

// Obtener perfil actual
router.get('/me', authMiddleware, authController.me);

// Cambiar contraseña
router.post('/change-password', [
  authMiddleware,
  body('currentPassword').notEmpty().withMessage('Contraseña actual requerida'),
  body('newPassword').isLength({ min: 6 }).withMessage('La nueva contraseña debe tener al menos 6 caracteres'),
  validateRequest
], authController.changePassword);

module.exports = router;

