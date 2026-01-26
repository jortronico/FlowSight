const express = require('express');
const homeAlarmController = require('../controllers/homeAlarm.controller');
const { authMiddleware, adminMiddleware, operatorMiddleware } = require('../middlewares/auth.middleware');

const router = express.Router();

// Todas las rutas requieren autenticación
router.use(authMiddleware);

// Estado y control principal
router.get('/status', homeAlarmController.getStatus);

// Rutas críticas: Solo admin puede activar/desactivar alarma y controlar sirena
router.post('/arm', adminMiddleware, homeAlarmController.arm);
router.post('/disarm', adminMiddleware, homeAlarmController.disarm);

// Control de sirena: Solo admin puede activar sirena manualmente
router.post('/siren/activate', adminMiddleware, homeAlarmController.activateSiren);
router.post('/siren/deactivate', adminMiddleware, homeAlarmController.deactivateSiren);

// Resetear tamper: Solo admin puede resetear
router.post('/reset-tamper', adminMiddleware, homeAlarmController.resetTamper);

// Sensores: Operadores y admin pueden ver, solo admin puede modificar
router.get('/sensors', homeAlarmController.getSensors);
router.put('/sensors/:id/toggle', adminMiddleware, homeAlarmController.toggleSensor);

// Horarios: Operadores y admin pueden ver, solo admin puede crear/modificar
router.get('/schedules', homeAlarmController.getSchedules);
router.post('/schedules', adminMiddleware, homeAlarmController.createSchedule);
router.put('/schedules/:id', adminMiddleware, homeAlarmController.updateSchedule);
router.delete('/schedules/:id', adminMiddleware, homeAlarmController.deleteSchedule);
router.put('/schedules/:id/toggle', adminMiddleware, homeAlarmController.toggleSchedule);

// Configuración: Solo admin puede modificar configuración automática
router.put('/auto-arm', adminMiddleware, homeAlarmController.setAutoArm);

// Historial
router.get('/history', homeAlarmController.getHistory);

module.exports = router;
