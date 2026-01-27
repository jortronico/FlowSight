const HomeAlarmModel = require('../models/homeAlarm.model');
const socketService = require('../services/socket.service');
const db = require('../config/database');

// API Keys válidas para dispositivos (en producción, esto debería estar en BD)
const VALID_API_KEYS = {
  'home_alarm_central_001': process.env.DEVICE_001_API_KEY || 'device_api_key_here',
  'sensor_escalera_001': process.env.SENSOR_ESCALERA_API_KEY || 'sensor_escalera_key',
  'sensor_sala_001': process.env.SENSOR_SALA_API_KEY || 'sensor_sala_key'
};

// Middleware de autenticación por API Key
const deviceAuthMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  const deviceId = req.headers['x-device-id'];

  if (!apiKey || !deviceId) {
    return res.status(401).json({
      success: false,
      message: 'API Key y Device ID requeridos'
    });
  }

  // Verificar API Key
  if (VALID_API_KEYS[deviceId] !== apiKey) {
    console.log(`❌ Autenticación fallida para dispositivo: ${deviceId}`);
    return res.status(401).json({
      success: false,
      message: 'API Key inválida'
    });
  }

  req.deviceId = deviceId;
  next();
};

const homeAlarmDeviceController = {
  // Recibir estado de la central
  async receiveStatus(req, res) {
    try {
      const deviceId = req.deviceId;
      const { 
        alarm_armed, 
        siren_active, 
        siren_state, 
        tamper_triggered, 
        tamper_state,
        wifi_rssi,
        uptime,
        free_heap,
        timestamp 
      } = req.body;

      // Actualizar estado en base de datos
      const db = require('../config/database');
      await db.execute(
        `UPDATE home_alarm 
         SET status = ?, 
             siren_status = ?,
             tamper_triggered = ?,
             tamper_state = ?,
             siren_state = ?,
             updated_at = NOW()
         WHERE id = 1`,
        [
          alarm_armed ? 'armed' : 'disarmed',
          siren_active ? 'on' : 'off',
          tamper_triggered || false,
          tamper_state !== undefined ? tamper_state : 0,
          siren_state !== undefined ? siren_state : 0
        ]
      );

      // Obtener estado actualizado
      const status = await HomeAlarmModel.getStatus();

      // Notificar por Socket.IO
      socketService.emit('home_alarm:central_status', {
        device_id: deviceId,
        alarm_armed,
        siren_active,
        siren_state,
        tamper_triggered,
        tamper_state,
        wifi_rssi,
        uptime,
        timestamp
      });

      res.json({
        success: true,
        message: 'Estado recibido'
      });
    } catch (error) {
      console.error('Error recibiendo estado:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando estado'
      });
    }
  },

  // Recibir heartbeat
  async receiveHeartbeat(req, res) {
    try {
      const deviceId = req.deviceId;
      const { 
        alarm_armed, 
        siren_active, 
        siren_state, 
        tamper_triggered, 
        tamper_state,
        wifi_rssi,
        uptime,
        timestamp 
      } = req.body;

      // Actualizar solo campos críticos
      await db.execute(
        `UPDATE home_alarm 
         SET tamper_state = ?,
             siren_state = ?,
             updated_at = NOW()
         WHERE id = 1`,
        [
          tamper_state !== undefined ? tamper_state : 0,
          siren_state !== undefined ? siren_state : 0
        ]
      );

      // Notificar por Socket.IO
      socketService.emit('home_alarm:heartbeat', {
        device_id: deviceId,
        alarm_armed,
        siren_active,
        siren_state,
        tamper_triggered,
        tamper_state,
        wifi_rssi,
        uptime,
        timestamp
      });

      res.json({
        success: true,
        message: 'Heartbeat recibido'
      });
    } catch (error) {
      console.error('Error recibiendo heartbeat:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando heartbeat'
      });
    }
  },

  // Recibir trigger de sensor o tamper
  async receiveTrigger(req, res) {
    try {
      const deviceId = req.deviceId;
      const { 
        sensor_id, 
        sensor_name, 
        triggered, 
        event_type,
        tamper_triggered,
        tamper_state,
        alarm_armed,
        message,
        timestamp 
      } = req.body;

      // Si es un sensor
      if (sensor_id) {
        // Actualizar estado del sensor
        await HomeAlarmModel.updateSensorTrigger(sensor_id, triggered);

        // Si la alarma está armada y el sensor se activó, disparar alarma
        if (alarm_armed && triggered) {
          await HomeAlarmModel.updateStatus('triggered', null, 'trigger');
          
          // Activar sirena
          await HomeAlarmModel.updateSirenStatus('on');
        }

        // Agregar al historial
        await HomeAlarmModel.addHistory({
          event_type: triggered ? 'sensor_triggered' : 'sensor_restored',
          sensor_id,
          message: message || `Sensor ${sensor_name} ${triggered ? 'activado' : 'restaurado'}`
        });

        // Notificar por Socket.IO
        socketService.emit('home_alarm:trigger', {
          device_id: deviceId,
          sensor_id,
          sensor_name,
          triggered,
          timestamp
        });
      }
      // Si es tamper
      else if (event_type && (event_type === 'tamper_activated' || event_type === 'tamper_restored')) {
        // Actualizar estado de tamper
        await db.execute(
          `UPDATE home_alarm 
           SET tamper_triggered = ?,
               tamper_state = ?,
               updated_at = NOW()
           WHERE id = 1`,
          [tamper_triggered || false, tamper_state !== undefined ? tamper_state : 0]
        );

        // Si tamper activado, activar sirena
        if (tamper_triggered) {
          await HomeAlarmModel.updateSirenStatus('on');
        }

        // Agregar al historial
        await HomeAlarmModel.addHistory({
          event_type: tamper_triggered ? 'tamper_activated' : 'tamper_restored',
          message: message || (tamper_triggered ? 'Tamper activado' : 'Tamper restaurado')
        });

        // Notificar por Socket.IO
        socketService.emit('home_alarm:event', {
          event_type: tamper_triggered ? 'tamper_activated' : 'tamper_restored',
          message,
          timestamp
        });
      }

      res.json({
        success: true,
        message: 'Trigger recibido'
      });
    } catch (error) {
      console.error('Error recibiendo trigger:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando trigger'
      });
    }
  },

  // Recibir datos de sensores
  async receiveSensorData(req, res) {
    try {
      const deviceId = req.deviceId;
      const { sensor_id, sensor_name, triggered, rssi, timestamp } = req.body;

      // Actualizar estado del sensor
      if (sensor_id) {
        await HomeAlarmModel.updateSensorTrigger(sensor_id, triggered);
      }

      // Notificar por Socket.IO
      socketService.emit('home_alarm:sensor_data', {
        device_id: deviceId,
        sensor_id,
        sensor_name,
        triggered,
        rssi,
        timestamp
      });

      res.json({
        success: true,
        message: 'Datos de sensor recibidos'
      });
    } catch (error) {
      console.error('Error recibiendo datos de sensor:', error);
      res.status(500).json({
        success: false,
        message: 'Error procesando datos de sensor'
      });
    }
  },

  // Obtener comandos pendientes (polling)
  async getCommands(req, res) {
    try {
      const deviceId = req.deviceId;

      // Obtener el comando más antiguo pendiente para este dispositivo
      const [commands] = await db.execute(
        `SELECT id, command, value, metadata 
         FROM device_commands 
         WHERE device_id = ? 
           AND status = 'pending' 
           AND (expires_at IS NULL OR expires_at > NOW())
         ORDER BY created_at ASC 
         LIMIT 1`,
        [deviceId]
      );

      if (commands.length > 0) {
        const cmd = commands[0];
        
        // Marcar como enviado
        await db.execute(
          `UPDATE device_commands 
           SET status = 'sent', sent_at = NOW() 
           WHERE id = ?`,
          [cmd.id]
        );

        // Parsear valor
        let value = true;
        if (cmd.value) {
          if (cmd.value === 'true' || cmd.value === 'false') {
            value = cmd.value === 'true';
          } else {
            value = cmd.value;
          }
        }

        res.json({
          success: true,
          has_command: true,
          command: cmd.command,
          value: value,
          command_id: cmd.id,
          metadata: cmd.metadata ? JSON.parse(cmd.metadata) : null
        });
      } else {
        res.json({
          success: true,
          has_command: false,
          command: null,
          value: null
        });
      }
    } catch (error) {
      console.error('Error obteniendo comandos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo comandos'
      });
    }
  },

  // Confirmar ejecución de comando (opcional)
  async confirmCommand(req, res) {
    try {
      const deviceId = req.deviceId;
      const { command_id, success: executed } = req.body;

      if (command_id) {
        await db.execute(
          `UPDATE device_commands 
           SET status = ?, executed_at = NOW() 
           WHERE id = ? AND device_id = ?`,
          [executed ? 'executed' : 'failed', command_id, deviceId]
        );
      }

      res.json({
        success: true,
        message: 'Comando confirmado'
      });
    } catch (error) {
      console.error('Error confirmando comando:', error);
      res.status(500).json({
        success: false,
        message: 'Error confirmando comando'
      });
    }
  }
};

module.exports = {
  homeAlarmDeviceController,
  deviceAuthMiddleware
};
