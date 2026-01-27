const express = require('express');
const { homeAlarmDeviceController, deviceAuthMiddleware } = require('../controllers/homeAlarmDevice.controller');

const router = express.Router();

// Todas las rutas requieren autenticación por API Key
router.use(deviceAuthMiddleware);

// Endpoints para que la central envíe datos
router.post('/status', homeAlarmDeviceController.receiveStatus);
router.post('/heartbeat', homeAlarmDeviceController.receiveHeartbeat);
router.post('/trigger', homeAlarmDeviceController.receiveTrigger);
router.post('/sensor-data', homeAlarmDeviceController.receiveSensorData);

// Endpoint para que la central obtenga comandos (polling)
router.get('/commands', homeAlarmDeviceController.getCommands);
router.post('/commands/confirm', homeAlarmDeviceController.confirmCommand);

module.exports = router;
