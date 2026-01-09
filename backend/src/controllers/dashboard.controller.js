const AlarmModel = require('../models/alarm.model');
const ValveModel = require('../models/valve.model');
const DeviceModel = require('../models/device.model');

const dashboardController = {
  async getOverview(req, res) {
    try {
      const [alarmStats, valveStats, deviceStats] = await Promise.all([
        AlarmModel.getStatistics(),
        ValveModel.getStatistics(),
        DeviceModel.getStatistics()
      ]);

      res.json({
        success: true,
        data: {
          alarms: alarmStats,
          valves: valveStats,
          devices: deviceStats,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Error obteniendo resumen:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo resumen del dashboard'
      });
    }
  },

  async getRecentActivity(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 20;
      
      const [recentAlarms, activeAlarms] = await Promise.all([
        AlarmModel.findAll({ limit }),
        AlarmModel.findActiveAlarms()
      ]);

      res.json({
        success: true,
        data: {
          recentAlarms,
          activeAlarms
        }
      });
    } catch (error) {
      console.error('Error obteniendo actividad reciente:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo actividad reciente'
      });
    }
  },

  async getSystemHealth(req, res) {
    try {
      const deviceStats = await DeviceModel.getStatistics();
      const offlineDevices = await DeviceModel.getOfflineDevices(5);

      const healthScore = deviceStats.total > 0 
        ? Math.round((deviceStats.online / deviceStats.total) * 100) 
        : 100;

      res.json({
        success: true,
        data: {
          healthScore,
          devices: deviceStats,
          offlineDevices,
          status: healthScore >= 90 ? 'healthy' : healthScore >= 70 ? 'warning' : 'critical'
        }
      });
    } catch (error) {
      console.error('Error obteniendo salud del sistema:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo salud del sistema'
      });
    }
  }
};

module.exports = dashboardController;

