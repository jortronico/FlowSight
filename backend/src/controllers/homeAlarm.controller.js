const HomeAlarmModel = require('../models/homeAlarm.model');
const socketService = require('../services/socket.service');
const mqttService = require('../services/mqtt.service');
const homeAlarmDeviceController = require('./homeAlarmDevice.controller');
const db = require('../config/database');

// Función auxiliar para crear comandos para dispositivos HTTP
const createDeviceCommand = async (deviceId, command, value, metadata = null) => {
  try {
    await db.execute(
      `INSERT INTO device_commands (device_id, command, value, metadata, expires_at) 
       VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
      [
        deviceId,
        command,
        String(value),
        metadata ? JSON.stringify(metadata) : null
      ]
    );
    console.log(`✅ Comando creado para dispositivo ${deviceId}: ${command} = ${value}`);
  } catch (error) {
    console.error(`❌ Error creando comando para dispositivo ${deviceId}:`, error);
  }
};

// Función para registrar eventos de seguridad
const logSecurityEvent = async (eventType, userId, details) => {
  try {
    await db.execute(
      `INSERT INTO system_logs (level, source, message, metadata, created_at) 
       VALUES (?, ?, ?, ?, NOW())`,
      [
        'warning',
        'security',
        `Evento de seguridad: ${eventType}`,
        JSON.stringify({ userId, ...details })
      ]
    );
  } catch (error) {
    console.error('Error registrando evento de seguridad:', error);
  }
};

const homeAlarmController = {
  // Obtener estado actual
  async getStatus(req, res) {
    try {
      const status = await HomeAlarmModel.getStatus();
      const sensors = await HomeAlarmModel.getSensors();
      const schedules = await HomeAlarmModel.getSchedules();

      // Agregar campos adicionales que pueden venir de MQTT
      // Si no existen en BD, se inicializan con valores por defecto
      const enhancedStatus = {
        ...status,
        tamper_triggered: status.tamper_triggered || false,
        tamper_state: status.tamper_state !== undefined ? status.tamper_state : 0,
        siren_state: status.siren_state !== undefined ? status.siren_state : 0,
        sensors,
        schedules
      };

      res.json({
        success: true,
        data: enhancedStatus
      });
    } catch (error) {
      console.error('Error obteniendo estado de alarma:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estado de alarma'
      });
    }
  },

  // Activar alarma
  async arm(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const userEmail = req.user.email;

      // Validación adicional: Solo admin puede activar
      if (userRole !== 'admin') {
        await logSecurityEvent('UNAUTHORIZED_ALARM_ARM_ATTEMPT', userId, {
          email: userEmail,
          role: userRole,
          ip: req.ip
        });
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden activar la alarma'
        });
      }

      // Registrar evento de seguridad
      await logSecurityEvent('ALARM_ARMED', userId, {
        email: userEmail,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      const status = await HomeAlarmModel.updateStatus('armed', userId, 'arm');
      
      await HomeAlarmModel.addHistory({
        event_type: 'armed',
        user_id: userId,
        message: 'Alarma activada manualmente'
      });

      // Enviar comando por MQTT a la central
      mqttService.publishHomeAlarmCommand('arm', true);
      
      // Crear comando para dispositivo HTTP (polling)
      await createDeviceCommand('home_alarm_central_001', 'arm', true);

      // Notificar por Socket.IO
      socketService.emit('home_alarm:status', status);
      socketService.emit('home_alarm:event', {
        event_type: 'armed',
        message: 'Alarma activada',
        timestamp: new Date()
      });

      res.json({
        success: true,
        data: status,
        message: 'Alarma activada'
      });
    } catch (error) {
      console.error('Error activando alarma:', error);
      res.status(500).json({
        success: false,
        message: 'Error activando alarma'
      });
    }
  },

  // Desactivar alarma
  async disarm(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const userEmail = req.user.email;

      // Validación adicional: Solo admin puede desactivar
      if (userRole !== 'admin') {
        await logSecurityEvent('UNAUTHORIZED_ALARM_DISARM_ATTEMPT', userId, {
          email: userEmail,
          role: userRole,
          ip: req.ip
        });
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden desactivar la alarma'
        });
      }

      // Registrar evento de seguridad
      await logSecurityEvent('ALARM_DISARMED', userId, {
        email: userEmail,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      const status = await HomeAlarmModel.updateStatus('disarmed', userId, 'disarm');
      
      // Desactivar sirena si está activa
      if (status.siren_status === 'on') {
        await HomeAlarmModel.updateSirenStatus('off');
        status.siren_status = 'off';
      }

      // Resetear sensores activados
      const sensors = await HomeAlarmModel.getSensors();
      for (const sensor of sensors) {
        if (sensor.is_triggered) {
          await HomeAlarmModel.updateSensorTrigger(sensor.id, false);
        }
      }

      await HomeAlarmModel.addHistory({
        event_type: 'disarmed',
        user_id: userId,
        message: 'Alarma desactivada manualmente'
      });

      // Enviar comando por MQTT a la central
      mqttService.publishHomeAlarmCommand('arm', false);
      
      // Crear comando para dispositivo HTTP (polling)
      await createDeviceCommand('home_alarm_central_001', 'disarm', false);

      // Notificar por Socket.IO
      socketService.emit('home_alarm:status', status);
      socketService.emit('home_alarm:event', {
        event_type: 'disarmed',
        message: 'Alarma desactivada',
        timestamp: new Date()
      });

      res.json({
        success: true,
        data: status,
        message: 'Alarma desactivada'
      });
    } catch (error) {
      console.error('Error desactivando alarma:', error);
      res.status(500).json({
        success: false,
        message: 'Error desactivando alarma'
      });
    }
  },

  // Activar sirena manualmente
  async activateSiren(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const userEmail = req.user.email;

      // Validación adicional: Solo admin puede activar sirena
      if (userRole !== 'admin') {
        await logSecurityEvent('UNAUTHORIZED_SIREN_ACTIVATION_ATTEMPT', userId, {
          email: userEmail,
          role: userRole,
          ip: req.ip
        });
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden activar la sirena'
        });
      }

      // Registrar evento de seguridad
      await logSecurityEvent('SIREN_ACTIVATED_MANUAL', userId, {
        email: userEmail,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      const status = await HomeAlarmModel.updateSirenStatus('manual');

      await HomeAlarmModel.addHistory({
        event_type: 'siren_on',
        user_id: userId,
        message: 'Sirena activada manualmente'
      });

      // Enviar comando por MQTT a la central
      mqttService.publishHomeAlarmCommand('siren', true);
      
      // Crear comando para dispositivo HTTP (polling)
      await createDeviceCommand('home_alarm_central_001', 'siren', true);

      socketService.emit('home_alarm:status', status);
      socketService.emit('home_alarm:event', {
        event_type: 'siren_on',
        message: 'Sirena activada',
        timestamp: new Date()
      });

      res.json({
        success: true,
        data: status,
        message: 'Sirena activada'
      });
    } catch (error) {
      console.error('Error activando sirena:', error);
      res.status(500).json({
        success: false,
        message: 'Error activando sirena'
      });
    }
  },

  // Resetear tamper
  async resetTamper(req, res) {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const userEmail = req.user.email;

      // Validación adicional: Solo admin puede resetear tamper
      if (userRole !== 'admin') {
        await logSecurityEvent('UNAUTHORIZED_TAMPER_RESET_ATTEMPT', userId, {
          email: userEmail,
          role: userRole,
          ip: req.ip
        });
        return res.status(403).json({
          success: false,
          message: 'Acceso denegado. Solo administradores pueden resetear el tamper'
        });
      }

      // Registrar evento de seguridad
      await logSecurityEvent('TAMPER_RESET', userId, {
        email: userEmail,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });

      // Actualizar estado en base de datos
      const db = require('../config/database');
      await db.execute(
        'UPDATE home_alarm SET tamper_triggered = FALSE, tamper_state = 0, updated_at = NOW() WHERE id = ?',
        [1]
      );

      const status = await HomeAlarmModel.getStatus();
      
      // Enviar comando por MQTT a la central para resetear tamper
      mqttService.publishHomeAlarmCommand('reset_tamper', false);
      
      // Notificar por Socket.IO
      socketService.emit('home_alarm:status', {
        ...status,
        tamper_triggered: false,
        tamper_state: 0
      });

      res.json({
        success: true,
        data: status,
        message: 'Estado de tamper reseteado correctamente'
      });
    } catch (error) {
      console.error('Error reseteando tamper:', error);
      res.status(500).json({
        success: false,
        message: 'Error reseteando tamper'
      });
    }
  },

  // Desactivar sirena
  async deactivateSiren(req, res) {
    try {
      const userId = req.user.id;
      const status = await HomeAlarmModel.updateSirenStatus('off');

      await HomeAlarmModel.addHistory({
        event_type: 'siren_off',
        user_id: userId,
        message: 'Sirena desactivada manualmente'
      });

      // Enviar comando por MQTT a la central
      mqttService.publishHomeAlarmCommand('siren', false);
      
      // Crear comando para dispositivo HTTP (polling)
      await createDeviceCommand('home_alarm_central_001', 'siren', false);

      socketService.emit('home_alarm:status', status);
      socketService.emit('home_alarm:event', {
        event_type: 'siren_off',
        message: 'Sirena desactivada',
        timestamp: new Date()
      });

      res.json({
        success: true,
        data: status,
        message: 'Sirena desactivada'
      });
    } catch (error) {
      console.error('Error desactivando sirena:', error);
      res.status(500).json({
        success: false,
        message: 'Error desactivando sirena'
      });
    }
  },

  // Obtener sensores
  async getSensors(req, res) {
    try {
      const sensors = await HomeAlarmModel.getSensors();

      res.json({
        success: true,
        data: sensors
      });
    } catch (error) {
      console.error('Error obteniendo sensores:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo sensores'
      });
    }
  },

  // Activar/desactivar sensor
  async toggleSensor(req, res) {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      const sensor = await HomeAlarmModel.toggleSensor(id, enabled);

      await HomeAlarmModel.addHistory({
        event_type: enabled ? 'sensor_enabled' : 'sensor_disabled',
        sensor_id: id,
        message: `Sensor ${enabled ? 'activado' : 'desactivado'}: ${sensor.name}`
      });

      socketService.emit('home_alarm:sensor_updated', sensor);

      res.json({
        success: true,
        data: sensor,
        message: `Sensor ${enabled ? 'activado' : 'desactivado'}`
      });
    } catch (error) {
      console.error('Error actualizando sensor:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando sensor'
      });
    }
  },

  // Obtener horarios
  async getSchedules(req, res) {
    try {
      const schedules = await HomeAlarmModel.getSchedules();

      res.json({
        success: true,
        data: schedules
      });
    } catch (error) {
      console.error('Error obteniendo horarios:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo horarios'
      });
    }
  },

  // Crear horario
  async createSchedule(req, res) {
    try {
      const { name, action, days_of_week, time, is_enabled = true } = req.body;

      if (!name || !action || !days_of_week || !time) {
        return res.status(400).json({
          success: false,
          message: 'Faltan campos requeridos'
        });
      }

      const schedule = await HomeAlarmModel.createSchedule({
        name,
        action,
        days_of_week,
        time,
        is_enabled
      });

      socketService.emit('home_alarm:schedule_created', schedule);

      res.json({
        success: true,
        data: schedule,
        message: 'Horario creado'
      });
    } catch (error) {
      console.error('Error creando horario:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando horario'
      });
    }
  },

  // Actualizar horario
  async updateSchedule(req, res) {
    try {
      const { id } = req.params;
      const { name, action, days_of_week, time, is_enabled } = req.body;

      const schedule = await HomeAlarmModel.updateSchedule(id, {
        name,
        action,
        days_of_week,
        time,
        is_enabled
      });

      socketService.emit('home_alarm:schedule_updated', schedule);

      res.json({
        success: true,
        data: schedule,
        message: 'Horario actualizado'
      });
    } catch (error) {
      console.error('Error actualizando horario:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando horario'
      });
    }
  },

  // Eliminar horario
  async deleteSchedule(req, res) {
    try {
      const { id } = req.params;
      await HomeAlarmModel.deleteSchedule(id);

      socketService.emit('home_alarm:schedule_deleted', { id });

      res.json({
        success: true,
        message: 'Horario eliminado'
      });
    } catch (error) {
      console.error('Error eliminando horario:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando horario'
      });
    }
  },

  // Habilitar/deshabilitar horario
  async toggleSchedule(req, res) {
    try {
      const { id } = req.params;
      const { enabled } = req.body;

      const schedule = await HomeAlarmModel.toggleSchedule(id, enabled);

      socketService.emit('home_alarm:schedule_updated', schedule);

      res.json({
        success: true,
        data: schedule,
        message: `Horario ${enabled ? 'habilitado' : 'deshabilitado'}`
      });
    } catch (error) {
      console.error('Error actualizando horario:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando horario'
      });
    }
  },

  // Habilitar/deshabilitar activación automática
  async setAutoArm(req, res) {
    try {
      const { enabled } = req.body;
      const status = await HomeAlarmModel.setAutoArm(enabled);

      socketService.emit('home_alarm:status', status);

      res.json({
        success: true,
        data: status,
        message: `Activación automática ${enabled ? 'habilitada' : 'deshabilitada'}`
      });
    } catch (error) {
      console.error('Error actualizando activación automática:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando activación automática'
      });
    }
  },

  // Obtener historial
  async getHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const history = await HomeAlarmModel.getHistory(limit);

      res.json({
        success: true,
        data: history
      });
    } catch (error) {
      console.error('Error obteniendo historial:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo historial'
      });
    }
  }
};

module.exports = homeAlarmController;
