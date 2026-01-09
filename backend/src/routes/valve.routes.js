const express = require('express');
const { body } = require('express-validator');
const valveController = require('../controllers/valve.controller');
const { authMiddleware, operatorMiddleware, adminMiddleware } = require('../middlewares/auth.middleware');
const validateRequest = require('../middlewares/validate.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todas las válvulas
router.get('/', valveController.getAll);

// Obtener estadísticas
router.get('/statistics', valveController.getStatistics);

// Obtener válvula por ID
router.get('/:id', valveController.getById);

// Obtener historial de válvula
router.get('/:id/history', valveController.getHistory);

// Crear válvula (solo admin)
router.post('/', [
  adminMiddleware,
  body('device_id').isInt().withMessage('ID de dispositivo inválido'),
  body('name').notEmpty().withMessage('Nombre requerido'),
  validateRequest
], valveController.create);

// Actualizar válvula (solo admin)
router.put('/:id', adminMiddleware, valveController.update);

// Configurar posición (requiere operador)
router.post('/:id/position', [
  operatorMiddleware,
  body('position').isFloat({ min: 0, max: 100 }).withMessage('Posición debe estar entre 0 y 100'),
  validateRequest
], valveController.setPosition);

// Abrir válvula (requiere operador)
router.post('/:id/open', operatorMiddleware, valveController.open);

// Cerrar válvula (requiere operador)
router.post('/:id/close', operatorMiddleware, valveController.close);

// Eliminar válvula (solo admin)
router.delete('/:id', adminMiddleware, valveController.delete);

module.exports = router;

