const express = require('express');
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validate.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación y permisos de admin
router.use(authMiddleware);
router.use(adminMiddleware);

// Obtener todos los usuarios
router.get('/', userController.getAll);

// Obtener usuario por ID
router.get('/:id', userController.getById);

// Crear usuario
router.post('/', [
  body('email').isEmail().withMessage('Email inválido'),
  body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('role').isIn(['admin', 'operator', 'viewer']).withMessage('Rol inválido'),
  validateRequest
], userController.create);

// Actualizar usuario
router.put('/:id', userController.update);

// Restablecer contraseña
router.post('/:id/reset-password', [
  body('newPassword').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
  validateRequest
], userController.resetPassword);

// Eliminar usuario
router.delete('/:id', userController.delete);

module.exports = router;

