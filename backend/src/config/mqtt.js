module.exports = {
  broker: {
    host: process.env.MQTT_BROKER_HOST || 'localhost',
    port: parseInt(process.env.MQTT_PORT) || 1883,
    username: process.env.MQTT_USERNAME || 'flowsight',
    password: process.env.MQTT_PASSWORD || 'mqtt_password'
  },
  topics: {
    // Alarmas
    ALARM_STATUS: 'flowsight/alarms/+/status',
    ALARM_TRIGGER: 'flowsight/alarms/+/trigger',
    ALARM_ACK: 'flowsight/alarms/+/acknowledge',
    
    // Válvulas
    VALVE_STATUS: 'flowsight/valves/+/status',
    VALVE_COMMAND: 'flowsight/valves/+/command',
    VALVE_POSITION: 'flowsight/valves/+/position',
    
    // Dispositivos
    DEVICE_HEARTBEAT: 'flowsight/devices/+/heartbeat',
    DEVICE_TELEMETRY: 'flowsight/devices/+/telemetry',
    
    // Sistema
    SYSTEM_STATUS: 'flowsight/system/status'
  },
  options: {
    clean: true,
    connectTimeout: 4000,
    reconnectPeriod: 1000,
    clientId: `flowsight_backend_${Math.random().toString(16).substr(2, 8)}`
  }
};

