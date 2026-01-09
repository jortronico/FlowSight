const express = require('express');
const alarmController = require('../controllers/alarm.controller');
const { authMiddleware, operatorMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Obtener todas las alarmas
router.get('/', alarmController.getAll);

// Obtener alarmas activas
router.get('/active', alarmController.getActive);

// Obtener estadísticas
router.get('/statistics', alarmController.getStatistics);

// Obtener historial
router.get('/history', alarmController.getHistory);

// Obtener alarma por ID
router.get('/:id', alarmController.getById);

// Reconocer alarma (requiere permisos de operador)
router.post('/:id/acknowledge', operatorMiddleware, alarmController.acknowledge);

// Resolver alarma (requiere permisos de operador)
router.post('/:id/resolve', operatorMiddleware, alarmController.resolve);

module.exports = router;

