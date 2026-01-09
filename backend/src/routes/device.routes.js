const express = require('express');
const { body } = require('express-validator');
const deviceController = require('../controllers/device.controller');
const { authMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validate.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todos los dispositivos
router.get('/', deviceController.getAll);

// Obtener estadísticas
router.get('/statistics', deviceController.getStatistics);

// Obtener dispositivo por ID
router.get('/:id', deviceController.getById);

// Crear dispositivo (solo admin)
router.post('/', [
  adminMiddleware,
  body('serial_number').notEmpty().withMessage('Número de serie requerido'),
  body('name').notEmpty().withMessage('Nombre requerido'),
  body('type').notEmpty().withMessage('Tipo requerido'),
  validateRequest
], deviceController.create);

// Actualizar dispositivo (solo admin)
router.put('/:id', adminMiddleware, deviceController.update);

// Eliminar dispositivo (solo admin)
router.delete('/:id', adminMiddleware, deviceController.delete);

module.exports = router;

