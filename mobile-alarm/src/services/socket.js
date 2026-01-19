import { io } from 'socket.io-client';
import { useHomeAlarmStore } from '../stores/homeAlarmStore';
import * as Haptics from 'expo-haptics';

// Cambiar esta URL según tu configuración
// Para Expo Go, usa la IP local de tu PC en la misma red WiFi
const SOCKET_URL = 'http://192.168.0.14:3001';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
  }

  connect() {
    if (this.socket?.connected) return;

    console.log('🔌 Intentando conectar Socket.IO a:', SOCKET_URL);

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'], // Intentar ambos
      autoConnect: true,
      timeout: 10000,
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5
    });

    this.socket.on('connect', () => {
      console.log('✅ Socket conectado');
      this.connected = true;
      this.joinRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket desconectado:', reason);
      this.connected = false;
    });

    this.socket.on('connect_error', (error) => {
      console.error('❌ Error de conexión Socket.IO:', error.message);
      console.error('   Verifica que el backend esté corriendo en:', SOCKET_URL);
    });

    this.setupListeners();
  }

  joinRooms() {
    if (this.socket && this.connected) {
      this.socket.emit('join:home_alarm');
    }
  }

  setupListeners() {
    // Eventos de alarma del hogar
    this.socket.on('home_alarm:status', (status) => {
      console.log('🏠 Actualización de estado de alarma:', status);
      useHomeAlarmStore.getState().updateStatus(status);
    });

    this.socket.on('home_alarm:event', (event) => {
      console.log('🚨 Evento de alarma:', event);
      // Vibración háptica para eventos críticos
      if (event.type === 'triggered' || event.type === 'armed') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } else {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    });

    this.socket.on('home_alarm:sensor_updated', (sensor) => {
      console.log('📡 Sensor actualizado:', sensor);
      useHomeAlarmStore.getState().updateSensor(sensor);
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

  // Métodos para agregar listeners personalizados
  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      if (callback) {
        this.socket.off(event, callback);
      } else {
        this.socket.off(event);
      }
    }
  }

  emit(event, data) {
    if (this.socket && this.connected) {
      this.socket.emit(event, data);
    }
  }
}

export const socketService = new SocketService();
export default socketService;

