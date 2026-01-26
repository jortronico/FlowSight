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
      mqttConfig.topics.DEVICE_TELEMETRY,
      // Home alarm topics
      'flowsight/home-alarm/central/status',
      'flowsight/home-alarm/central/command',
      'flowsight/home-alarm/sensors/data',
      'flowsight/home-alarm/central/trigger',
      'flowsight/home-alarm/central/heartbeat'
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

  // ============================================
  // HANDLERS PARA HOME ALARM
  // ============================================
  async handleHomeAlarmStatus(payload) {
    console.log('🏠 Estado central alarma:', payload);
    
    // Actualizar estado en base de datos
    try {
      const HomeAlarmModel = require('../models/homeAlarm.model');
      const db = require('../config/database');
      
      // Actualizar campos de tamper y sirena_state si vienen en el payload
      if (payload.tamper_triggered !== undefined || payload.siren_state !== undefined) {
        const updates = [];
        const params = [];
        
        if (payload.tamper_triggered !== undefined) {
          updates.push('tamper_triggered = ?', 'tamper_state = ?');
          params.push(payload.tamper_triggered, payload.tamper_triggered ? 1 : 0);
        }
        
        if (payload.siren_state !== undefined) {
          updates.push('siren_state = ?');
          params.push(payload.siren_state);
          
          // También actualizar siren_status basado en siren_state
          if (payload.siren_state === 1) {
            updates.push('siren_status = ?');
            params.push('on');
          } else {
            updates.push('siren_status = ?');
            params.push('off');
          }
        }
        
        if (updates.length > 0) {
          updates.push('updated_at = NOW()');
          params.push(1); // ID de la alarma
          
          await db.execute(
            `UPDATE home_alarm SET ${updates.join(', ')} WHERE id = ?`,
            params
          );
        }
      }
    } catch (error) {
      console.error('Error actualizando estado desde MQTT:', error);
    }
    
    if (socketService) {
      socketService.emit('home_alarm:central_status', payload);
      // También emitir actualización de estado general
      socketService.emit('home_alarm:status', {
        ...payload,
        siren_status: payload.siren_active ? 'on' : 'off',
      });
    }
  },

  async handleHomeAlarmSensorData(payload) {
    console.log('📡 Datos sensor alarma:', payload);
    
    if (socketService) {
      socketService.emit('home_alarm:sensor_data', payload);
    }
  },

  async handleHomeAlarmTrigger(payload) {
    console.log('🚨 Alarma disparada:', payload);
    
    // Aquí podrías guardar en base de datos si es necesario
    if (socketService) {
      socketService.emit('home_alarm:trigger', payload);
      socketService.emit('home_alarm:event', {
        event_type: 'triggered',
        message: `Sensor ${payload.sensor_name} activado`,
        sensor_id: payload.sensor_id,
        timestamp: new Date()
      });
    }
  },

  async handleHomeAlarmHeartbeat(payload) {
    // Log cada 10 heartbeats para no saturar
    if (Math.random() < 0.1) {
      console.log('💓 Heartbeat central alarma:', payload.device_id);
    }
    
    if (socketService) {
      socketService.emit('home_alarm:heartbeat', payload);
    }
  },

  // Publicar comando a la central
  publishHomeAlarmCommand(command, value) {
    const topic = 'flowsight/home-alarm/central/command';
    const payload = {
      command,
      value,
      timestamp: new Date().toISOString()
    };
    
    this.publish(topic, payload);
    console.log(`📤 Comando enviado a central: ${command} = ${value}`);
  },

  getClient() {
    return client;
  }
};

module.exports = mqttService;

