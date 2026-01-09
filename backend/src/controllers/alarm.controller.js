const AlarmModel = require('../models/alarm.model');
const mqttService = require('../services/mqtt.service');
const socketService = require('../services/socket.service');

const alarmController = {
  async getAll(req, res) {
    try {
      const filters = {
        status: req.query.status,
        priority: req.query.priority,
        device_id: req.query.device_id,
        limit: req.query.limit
      };

      const alarms = await AlarmModel.findAll(filters);
      
      res.json({
        success: true,
        data: alarms
      });
    } catch (error) {
      console.error('Error obteniendo alarmas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo alarmas'
      });
    }
  },

  async getActive(req, res) {
    try {
      const alarms = await AlarmModel.findActiveAlarms();
      
      res.json({
        success: true,
        data: alarms
      });
    } catch (error) {
      console.error('Error obteniendo alarmas activas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo alarmas activas'
      });
    }
  },

  async getById(req, res) {
    try {
      const alarm = await AlarmModel.findById(req.params.id);
      
      if (!alarm) {
        return res.status(404).json({
          success: false,
          message: 'Alarma no encontrada'
        });
      }

      res.json({
        success: true,
        data: alarm
      });
    } catch (error) {
      console.error('Error obteniendo alarma:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo alarma'
      });
    }
  },

  async acknowledge(req, res) {
    try {
      const alarm = await AlarmModel.findById(req.params.id);
      
      if (!alarm) {
        return res.status(404).json({
          success: false,
          message: 'Alarma no encontrada'
        });
      }

      if (alarm.status !== 'active') {
        return res.status(400).json({
          success: false,
          message: 'Solo se pueden reconocer alarmas activas'
        });
      }

      const updatedAlarm = await AlarmModel.acknowledge(req.params.id, req.user.id);

      // Notificar por MQTT
      mqttService.publishAlarmAck(updatedAlarm);
      
      // Notificar por WebSocket
      socketService.emitAlarmUpdate(updatedAlarm);

      res.json({
        success: true,
        message: 'Alarma reconocida',
        data: updatedAlarm
      });
    } catch (error) {
      console.error('Error reconociendo alarma:', error);
      res.status(500).json({
        success: false,
        message: 'Error reconociendo alarma'
      });
    }
  },

  async resolve(req, res) {
    try {
      const { notes } = req.body;
      const alarm = await AlarmModel.findById(req.params.id);
      
      if (!alarm) {
        return res.status(404).json({
          success: false,
          message: 'Alarma no encontrada'
        });
      }

      if (alarm.status === 'resolved') {
        return res.status(400).json({
          success: false,
          message: 'La alarma ya está resuelta'
        });
      }

      const updatedAlarm = await AlarmModel.resolve(req.params.id, req.user.id, notes);

      // Notificar por WebSocket
      socketService.emitAlarmUpdate(updatedAlarm);

      res.json({
        success: true,
        message: 'Alarma resuelta',
        data: updatedAlarm
      });
    } catch (error) {
      console.error('Error resolviendo alarma:', error);
      res.status(500).json({
        success: false,
        message: 'Error resolviendo alarma'
      });
    }
  },

  async getStatistics(req, res) {
    try {
      const stats = await AlarmModel.getStatistics();
      
      res.json({
        success: true,
        data: stats
      });
    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas'
      });
    }
  },

  async getHistory(req, res) {
    try {
      const days = parseInt(req.query.days) || 7;
      const history = await AlarmModel.getHistory(days);
      
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

module.exports = alarmController;

