/**
 * Middleware de autenticación para dispositivos ESP32
 * Valida el Device ID y Secret enviados en headers
 */

const deviceAuthMiddleware = (req, res, next) => {
  const deviceId = req.headers['x-device-id'];
  const deviceSecret = req.headers['x-device-secret'];

  // Validar que existan los headers
  if (!deviceId || !deviceSecret) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación de dispositivo requerida. Headers X-Device-ID y X-Device-Secret necesarios'
    });
  }

  // Base de datos de dispositivos autorizados
  // En producción, esto debería estar en la base de datos
  const authorizedDevices = {
    'home_alarm_central_001': process.env.DEVICE_001_SECRET || 'device_secret_key_001',
    'sensor_escalera_001': process.env.SENSOR_ESCALERA_SECRET || 'device_secret_key_002',
    'sensor_sala_001': process.env.SENSOR_SALA_SECRET || 'device_secret_key_003',
  };

  // Validar credenciales
  if (authorizedDevices[deviceId] === deviceSecret) {
    req.device = {
      id: deviceId,
      secret: deviceSecret
    };
    next();
  } else {
    console.log(`❌ Autenticación fallida para dispositivo: ${deviceId}`);
    return res.status(401).json({
      success: false,
      message: 'Credenciales de dispositivo inválidas'
    });
  }
};

module.exports = { deviceAuthMiddleware };
