const DeviceModel = require('../models/device.model');

const deviceController = {
  async getAll(req, res) {
    try {
      const filters = {
        status: req.query.status,
        type: req.query.type
      };

      const devices = await DeviceModel.findAll(filters);
      
      res.json({
        success: true,
        data: devices
      });
    } catch (error) {
      console.error('Error obteniendo dispositivos:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo dispositivos'
      });
    }
  },

  async getById(req, res) {
    try {
      const device = await DeviceModel.findById(req.params.id);
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Dispositivo no encontrado'
        });
      }

      res.json({
        success: true,
        data: device
      });
    } catch (error) {
      console.error('Error obteniendo dispositivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo dispositivo'
      });
    }
  },

  async create(req, res) {
    try {
      const { serial_number } = req.body;

      // Verificar si ya existe
      const existing = await DeviceModel.findBySerialNumber(serial_number);
      if (existing) {
        return res.status(400).json({
          success: false,
          message: 'Ya existe un dispositivo con ese número de serie'
        });
      }

      const device = await DeviceModel.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Dispositivo creado exitosamente',
        data: device
      });
    } catch (error) {
      console.error('Error creando dispositivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando dispositivo'
      });
    }
  },

  async update(req, res) {
    try {
      const device = await DeviceModel.findById(req.params.id);
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Dispositivo no encontrado'
        });
      }

      const updatedDevice = await DeviceModel.update(req.params.id, req.body);
      
      res.json({
        success: true,
        message: 'Dispositivo actualizado',
        data: updatedDevice
      });
    } catch (error) {
      console.error('Error actualizando dispositivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando dispositivo'
      });
    }
  },

  async delete(req, res) {
    try {
      const device = await DeviceModel.findById(req.params.id);
      
      if (!device) {
        return res.status(404).json({
          success: false,
          message: 'Dispositivo no encontrado'
        });
      }

      await DeviceModel.delete(req.params.id);
      
      res.json({
        success: true,
        message: 'Dispositivo eliminado'
      });
    } catch (error) {
      console.error('Error eliminando dispositivo:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando dispositivo'
      });
    }
  },

  async getStatistics(req, res) {
    try {
      const stats = await DeviceModel.getStatistics();
      
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
  }
};

module.exports = deviceController;

