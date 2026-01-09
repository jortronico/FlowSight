const ValveModel = require('../models/valve.model');
const mqttService = require('../services/mqtt.service');
const socketService = require('../services/socket.service');

const valveController = {
  async getAll(req, res) {
    try {
      const filters = {
        status: req.query.status,
        device_id: req.query.device_id
      };

      const valves = await ValveModel.findAll(filters);
      
      res.json({
        success: true,
        data: valves
      });
    } catch (error) {
      console.error('Error obteniendo válvulas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo válvulas'
      });
    }
  },

  async getById(req, res) {
    try {
      const valve = await ValveModel.findById(req.params.id);
      
      if (!valve) {
        return res.status(404).json({
          success: false,
          message: 'Válvula no encontrada'
        });
      }

      res.json({
        success: true,
        data: valve
      });
    } catch (error) {
      console.error('Error obteniendo válvula:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo válvula'
      });
    }
  },

  async create(req, res) {
    try {
      const valve = await ValveModel.create(req.body);
      
      res.status(201).json({
        success: true,
        message: 'Válvula creada exitosamente',
        data: valve
      });
    } catch (error) {
      console.error('Error creando válvula:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando válvula'
      });
    }
  },

  async update(req, res) {
    try {
      const valve = await ValveModel.findById(req.params.id);
      
      if (!valve) {
        return res.status(404).json({
          success: false,
          message: 'Válvula no encontrada'
        });
      }

      const updatedValve = await ValveModel.update(req.params.id, req.body);
      
      res.json({
        success: true,
        message: 'Válvula actualizada',
        data: updatedValve
      });
    } catch (error) {
      console.error('Error actualizando válvula:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando válvula'
      });
    }
  },

  async setPosition(req, res) {
    try {
      const { position } = req.body;
      const valve = await ValveModel.findById(req.params.id);
      
      if (!valve) {
        return res.status(404).json({
          success: false,
          message: 'Válvula no encontrada'
        });
      }

      // Validar posición
      if (position < valve.min_position || position > valve.max_position) {
        return res.status(400).json({
          success: false,
          message: `La posición debe estar entre ${valve.min_position} y ${valve.max_position}`
        });
      }

      const updatedValve = await ValveModel.setPosition(req.params.id, position, req.user.id);

      // Enviar comando por MQTT
      mqttService.publishValveCommand(valve.device_id, req.params.id, position);
      
      // Notificar por WebSocket
      socketService.emitValveUpdate(updatedValve);

      res.json({
        success: true,
        message: 'Comando de posición enviado',
        data: updatedValve
      });
    } catch (error) {
      console.error('Error configurando posición:', error);
      res.status(500).json({
        success: false,
        message: 'Error configurando posición'
      });
    }
  },

  async open(req, res) {
    try {
      const valve = await ValveModel.findById(req.params.id);
      
      if (!valve) {
        return res.status(404).json({
          success: false,
          message: 'Válvula no encontrada'
        });
      }

      const updatedValve = await ValveModel.setPosition(req.params.id, valve.max_position, req.user.id);

      // Enviar comando por MQTT
      mqttService.publishValveCommand(valve.device_id, req.params.id, valve.max_position);
      
      // Notificar por WebSocket
      socketService.emitValveUpdate(updatedValve);

      res.json({
        success: true,
        message: 'Válvula abierta',
        data: updatedValve
      });
    } catch (error) {
      console.error('Error abriendo válvula:', error);
      res.status(500).json({
        success: false,
        message: 'Error abriendo válvula'
      });
    }
  },

  async close(req, res) {
    try {
      const valve = await ValveModel.findById(req.params.id);
      
      if (!valve) {
        return res.status(404).json({
          success: false,
          message: 'Válvula no encontrada'
        });
      }

      const updatedValve = await ValveModel.setPosition(req.params.id, 0, req.user.id);

      // Enviar comando por MQTT
      mqttService.publishValveCommand(valve.device_id, req.params.id, 0);
      
      // Notificar por WebSocket
      socketService.emitValveUpdate(updatedValve);

      res.json({
        success: true,
        message: 'Válvula cerrada',
        data: updatedValve
      });
    } catch (error) {
      console.error('Error cerrando válvula:', error);
      res.status(500).json({
        success: false,
        message: 'Error cerrando válvula'
      });
    }
  },

  async delete(req, res) {
    try {
      const valve = await ValveModel.findById(req.params.id);
      
      if (!valve) {
        return res.status(404).json({
          success: false,
          message: 'Válvula no encontrada'
        });
      }

      await ValveModel.delete(req.params.id);
      
      res.json({
        success: true,
        message: 'Válvula eliminada'
      });
    } catch (error) {
      console.error('Error eliminando válvula:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando válvula'
      });
    }
  },

  async getHistory(req, res) {
    try {
      const limit = parseInt(req.query.limit) || 50;
      const history = await ValveModel.getHistory(req.params.id, limit);
      
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
  },

  async getStatistics(req, res) {
    try {
      const stats = await ValveModel.getStatistics();
      
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

module.exports = valveController;

