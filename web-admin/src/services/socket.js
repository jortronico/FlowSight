import { io } from 'socket.io-client';
import { useAlarmStore } from '../stores/alarmStore';
import { useValveStore } from '../stores/valveStore';
import { useHomeAlarmStore } from '../stores/homeAlarmStore';

// Socket.IO necesita la URL base sin /api
const getSocketURL = () => {
  const apiUrl = import.meta.env.VITE_API_URL || 
    (import.meta.env.DEV ? 'http://localhost:3001' : 'https://alarma.puntopedido.com.ar');
  // Remover /api si está presente para Socket.IO
  return apiUrl.replace(/\/api$/, '');
};

const SOCKET_URL = getSocketURL();

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket?.connected) return;

    this.socket = io(SOCKET_URL, {
      transports: ['websocket'],
      autoConnect: true
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket conectado');
      this.connected = true;
      this.joinRooms();
    });

    this.socket.on('disconnect', () => {
      console.log('🔌 Socket desconectado');
      this.connected = false;
    });

    this.setupListeners();
  }

  joinRooms() {
    this.socket.emit('join:alarms');
    this.socket.emit('join:valves');
    this.socket.emit('join:devices');
    this.socket.emit('join:home_alarm');
  }

  setupListeners() {
    // Alarmas
    this.socket.on('alarm:new', (alarm) => {
      console.log('🚨 Nueva alarma:', alarm);
      useAlarmStore.getState().addAlarm(alarm);
      this.showNotification('Nueva Alarma', alarm.message);
    });

    this.socket.on('alarm:update', (alarm) => {
      console.log('🔔 Actualización de alarma:', alarm);
      useAlarmStore.getState().updateAlarm(alarm);
    });

    // Válvulas
    this.socket.on('valve:update', (valve) => {
      console.log('🔧 Actualización de válvula:', valve);
      useValveStore.getState().updateValve(valve);
    });

    // Dispositivos
    this.socket.on('device:update', (device) => {
      console.log('📱 Actualización de dispositivo:', device);
    });

    // Alarma del Hogar
    this.socket.on('home_alarm:status', (status) => {
      console.log('🏠 Actualización de alarma del hogar:', status);
      useHomeAlarmStore.getState().updateStatus(status);
    });

    this.socket.on('home_alarm:event', (event) => {
      console.log('🏠 Evento de alarma del hogar:', event);
      useHomeAlarmStore.getState().fetchStatus();
      useHomeAlarmStore.getState().fetchHistory(50);
      if (event.event_type === 'triggered') {
        this.showNotification('🚨 Alarma Disparada', event.message || 'La alarma del hogar se ha disparado');
      }
    });

    this.socket.on('home_alarm:sensor_updated', (sensor) => {
      console.log('🏠 Sensor actualizado:', sensor);
      useHomeAlarmStore.getState().updateSensor(sensor);
    });

    // Notificaciones generales
    this.socket.on('notification', (notification) => {
      this.showNotification(notification.title, notification.message);
    });
  }

  showNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, { body, icon: '/favicon.svg' });
    }
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  isConnected() {
    return this.connected;
  }
}

export const socketService = new SocketService();
export default socketService;

