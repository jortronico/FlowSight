const mqtt = require('mqtt');
const mqttConfig = require('../config/mqtt');
const AlarmModel = require('../models/alarm.model');
const ValveModel = require('../models/valve.model');
const DeviceModel = require('../models/device.model');

let client = null;
let socketService = null;

const mqttService = {
  connect() {
    const { host, port, username, password } = mqttConfig.broker;
    const url = `mqtt://${host}:${port}`;

    client = mqtt.connect(url, {
      ...mqttConfig.options,
      username,
      password
    });

    client.on('connect', () => {
      console.log('✅ Conectado al broker MQTT');
      this.subscribeToTopics();
    });

    client.on('error', (error) => {
      console.error('❌ Error MQTT:', error.message);
    });

    client.on('reconnect', () => {
      console.log('🔄 Reconectando al broker MQTT...');
    });

    client.on('message', this.handleMessage.bind(this));
  },

  setSocketService(service) {
    socketService = service;
  },

  subscribeToTopics() {
    const topics = [
      mqttConfig.topics.ALARM_TRIGGER,
      mqttConfig.topics.VALVE_STATUS,
      mqttConfig.topics.VALVE_POSITION,
      mqttConfig.topics.DEVICE_HEARTBEAT,
      mqttConfig.topics.DEVICE_TELEMETRY
    ];

    topics.forEach(topic => {
      client.subscribe(topic, (err) => {
        if (err) {
          console.error(`Error suscribiendo a ${topic}:`, err);
        } else {
          console.log(`📡 Suscrito a: ${topic}`);
        }
      });
    });
  },

  async handleMessage(topic, message) {
    try {
      const payload = JSON.parse(message.toString());
      const topicParts = topic.split('/');

      // flowsight/alarms/{deviceId}/trigger
      if (topic.match(/flowsight\/alarms\/\w+\/trigger/)) {
        await this.handleAlarmTrigger(topicParts[2], payload);
      }
      // flowsight/valves/{valveId}/status
      else if (topic.match(/flowsight\/valves\/\w+\/status/)) {
        await this.handleValveStatus(topicParts[2], payload);
      }
      // flowsight/valves/{valveId}/position
      else if (topic.match(/flowsight\/valves\/\w+\/position/)) {
        await this.handleValvePosition(topicParts[2], payload);
      }
      // flowsight/devices/{deviceId}/heartbeat
      else if (topic.match(/flowsight\/devices\/\w+\/heartbeat/)) {
        await this.handleDeviceHeartbeat(topicParts[2], payload);
      }
      // flowsight/devices/{deviceId}/telemetry
      else if (topic.match(/flowsight\/devices\/\w+\/telemetry/)) {
        await this.handleDeviceTelemetry(topicParts[2], payload);
      }
    } catch (error) {
      console.error('Error procesando mensaje MQTT:', error);
    }
  },

  async handleAlarmTrigger(deviceId, payload) {
    console.log(`🚨 Alarma recibida de dispositivo ${deviceId}:`, payload);

    try {
      const device = await DeviceModel.findBySerialNumber(deviceId);
      if (!device) {
        console.warn(`Dispositivo ${deviceId} no encontrado`);
        return;
      }

      const alarm = await AlarmModel.create({
        device_id: device.id,
        type: payload.type || 'unknown',
        message: payload.message || 'Alarma sin descripción',
        priority: payload.priority || 'medium',
        value: payload.value,
        threshold: payload.threshold
      });

      // Notificar por WebSocket
      if (socketService) {
        socketService.emitAlarmNew(alarm);
      }
    } catch (error) {
      console.error('Error guardando alarma:', error);
    }
  },

  async handleValveStatus(valveId, payload) {
    console.log(`🔧 Estado de válvula ${valveId}:`, payload);

    try {
      await ValveModel.updateStatus(valveId, payload.status, payload.position);
      
      const valve = await ValveModel.findById(valveId);
      if (valve && socketService) {
        socketService.emitValveUpdate(valve);
      }
    } catch (error) {
      console.error('Error actualizando estado de válvula:', error);
    }
  },

  async handleValvePosition(valveId, payload) {
    console.log(`📊 Posición de válvula ${valveId}:`, payload);

    try {
      const status = payload.position === 0 ? 'closed' : 
                     payload.position === 100 ? 'open' : 'partial';
      
      await ValveModel.updateStatus(valveId, status, payload.position);
      
      const valve = await ValveModel.findById(valveId);
      if (valve && socketService) {
        socketService.emitValveUpdate(valve);
      }
    } catch (error) {
      console.error('Error actualizando posición de válvula:', error);
    }
  },

  async handleDeviceHeartbeat(deviceId, payload) {
    try {
      const device = await DeviceModel.findBySerialNumber(deviceId);
      if (device) {
        await DeviceModel.updateHeartbeat(device.id);
      }
    } catch (error) {
      console.error('Error procesando heartbeat:', error);
    }
  },

  async handleDeviceTelemetry(deviceId, payload) {
    console.log(`📈 Telemetría de ${deviceId}:`, payload);
    
    // Emitir telemetría por WebSocket
    if (socketService) {
      socketService.emitTelemetry(deviceId, payload);
    }
  },

  // Publicar comandos
  publishValveCommand(deviceId, valveId, position) {
    const topic = `flowsight/valves/${valveId}/command`;
    const payload = {
      action: 'set_position',
      position,
      timestamp: new Date().toISOString()
    };

    client.publish(topic, JSON.stringify(payload), { qos: 1 }, (err) => {
      if (err) {
        console.error('Error publicando comando de válvula:', err);
      } else {
        console.log(`📤 Comando enviado a válvula ${valveId}: posición ${position}`);
      }
    });
  },

  publishAlarmAck(alarm) {
    const topic = `flowsight/alarms/${alarm.id}/acknowledge`;
    const payload = {
      alarm_id: alarm.id,
      acknowledged_at: alarm.acknowledged_at,
      timestamp: new Date().toISOString()
    };

    client.publish(topic, JSON.stringify(payload), { qos: 1 });
  },

  publish(topic, payload) {
    if (client && client.connected) {
      client.publish(topic, JSON.stringify(payload), { qos: 1 });
    }
  },

  getClient() {
    return client;
  }
};

module.exports = mqttService;

