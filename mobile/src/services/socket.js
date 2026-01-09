import { io } from 'socket.io-client';
import { useAlarmStore } from '../stores/alarmStore';
import { useValveStore } from '../stores/valveStore';
import * as Haptics from 'expo-haptics';

// Cambiar esta URL según tu configuración
const SOCKET_URL = 'http://192.168.1.100:3001';

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
  }

  setupListeners() {
    // Alarmas
    this.socket.on('alarm:new', (alarm) => {
      console.log('🚨 Nueva alarma:', alarm);
      useAlarmStore.getState().addAlarm(alarm);
      // Vibración háptica para alarmas críticas
      if (alarm.priority === 'critical' || alarm.priority === 'high') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    });

    this.socket.on('alarm:update', (alarm) => {
      console.log('🔔 Actualización de alarma:', alarm);
      useAlarmStore.getState().updateAlarm(alarm);
    });

    // Válvulas
    this.socket.on('valve:update', (valve) => {
      console.log('🔧 Actualización de válvula:', valve);
      useValveStore.getState().updateValve(valve);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    });
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

