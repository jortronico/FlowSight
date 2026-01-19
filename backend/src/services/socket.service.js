let io = null;

const socketService = {
  initialize(socketIO) {
    io = socketIO;

    io.on('connection', (socket) => {
      console.log(`🔌 Cliente conectado: ${socket.id}`);

      // Unirse a sala de alarmas
      socket.on('join:alarms', () => {
        socket.join('alarms');
        console.log(`${socket.id} se unió a sala de alarmas`);
      });

      // Unirse a sala de válvulas
      socket.on('join:valves', () => {
        socket.join('valves');
        console.log(`${socket.id} se unió a sala de válvulas`);
      });

      // Unirse a sala de dispositivos
      socket.on('join:devices', () => {
        socket.join('devices');
        console.log(`${socket.id} se unió a sala de dispositivos`);
      });

      // Unirse a sala de telemetría de un dispositivo específico
      socket.on('join:telemetry', (deviceId) => {
        socket.join(`telemetry:${deviceId}`);
        console.log(`${socket.id} se unió a telemetría de ${deviceId}`);
      });

      socket.on('disconnect', () => {
        console.log(`🔌 Cliente desconectado: ${socket.id}`);
      });
    });

    // Conectar con servicio MQTT
    const mqttService = require('./mqtt.service');
    mqttService.setSocketService(this);

    console.log('✅ Socket.IO inicializado');
  },

  // Emitir nueva alarma
  emitAlarmNew(alarm) {
    if (io) {
      io.to('alarms').emit('alarm:new', alarm);
      console.log('📢 Nueva alarma emitida:', alarm.id);
    }
  },

  // Emitir actualización de alarma
  emitAlarmUpdate(alarm) {
    if (io) {
      io.to('alarms').emit('alarm:update', alarm);
      console.log('📢 Actualización de alarma emitida:', alarm.id);
    }
  },

  // Emitir actualización de válvula
  emitValveUpdate(valve) {
    if (io) {
      io.to('valves').emit('valve:update', valve);
      console.log('📢 Actualización de válvula emitida:', valve.id);
    }
  },

  // Emitir actualización de dispositivo
  emitDeviceUpdate(device) {
    if (io) {
      io.to('devices').emit('device:update', device);
    }
  },

  // Emitir telemetría
  emitTelemetry(deviceId, data) {
    if (io) {
      io.to(`telemetry:${deviceId}`).emit('telemetry:data', {
        deviceId,
        data,
        timestamp: new Date().toISOString()
      });
    }
  },

  // Emitir notificación general
  emitNotification(notification) {
    if (io) {
      io.emit('notification', notification);
    }
  },

  // Método genérico para emitir eventos
  emit(event, data) {
    if (io) {
      io.emit(event, data);
    }
  },

  // Emitir a una sala específica
  emitToRoom(room, event, data) {
    if (io) {
      io.to(room).emit(event, data);
    }
  },

  getIO() {
    return io;
  }
};

module.exports = socketService;

