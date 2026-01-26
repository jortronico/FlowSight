import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

// Configurar cómo se manejan las notificaciones cuando la app está en foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

class NotificationService {
  constructor() {
    this.expoPushToken = null;
    this.notificationListener = null;
    this.responseListener = null;
  }

  // Solicitar permisos de notificaciones
  async requestPermissions() {
    if (!Device.isDevice) {
      console.log('⚠️ Las notificaciones push solo funcionan en dispositivos físicos');
      return false;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('❌ Permisos de notificaciones denegados');
      return false;
    }

    console.log('✅ Permisos de notificaciones concedidos');
    return true;
  }

  // Obtener token de notificaciones push (para envío remoto)
  async getExpoPushToken() {
    if (!Device.isDevice) {
      return null;
    }

    try {
      const tokenData = await Notifications.getExpoPushTokenAsync({
        projectId: 'your-project-id', // Opcional para Expo Go
      });
      this.expoPushToken = tokenData.data;
      console.log('📱 Expo Push Token:', this.expoPushToken);
      return this.expoPushToken;
    } catch (error) {
      console.error('Error obteniendo token:', error);
      return null;
    }
  }

  // Enviar notificación local
  async scheduleLocalNotification(title, body, data = {}) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: null, // null = mostrar inmediatamente
    });
  }

  // Enviar notificación de cambio de estado de alarma
  async notifyAlarmStatusChange(status, message) {
    const title = status === 'armed' 
      ? '🔒 Alarma Activada' 
      : status === 'disarmed'
      ? '🔓 Alarma Desactivada'
      : status === 'triggered'
      ? '🚨 Alarma Disparada'
      : '⚠️ Cambio de Estado';

    await this.scheduleLocalNotification(
      title,
      message,
      {
        type: 'alarm_status',
        status,
        timestamp: new Date().toISOString(),
      }
    );
  }

  // Enviar notificación de tamper
  async notifyTamper(activated) {
    const title = activated ? '🚨 TAMPER ACTIVADO' : '✅ Tamper Restaurado';
    const body = activated 
      ? 'Switch de sabotaje detectado - Verificar inmediatamente'
      : 'Switch de sabotaje restaurado';

    await this.scheduleLocalNotification(
      title,
      body,
      {
        type: 'tamper',
        activated,
        timestamp: new Date().toISOString(),
      }
    );
  }

  // Enviar notificación de sirena
  async notifySiren(activated) {
    const title = activated ? '🔊 Sirena Activada' : '🔇 Sirena Desactivada';
    const body = activated
      ? 'La sirena ha sido activada'
      : 'La sirena ha sido desactivada';

    await this.scheduleLocalNotification(
      title,
      body,
      {
        type: 'siren',
        activated,
        timestamp: new Date().toISOString(),
      }
    );
  }

  // Enviar notificación de sensor activado
  async notifySensorTriggered(sensorName) {
    await this.scheduleLocalNotification(
      '🚨 Sensor Activado',
      `Sensor ${sensorName} detectó movimiento`,
      {
        type: 'sensor_triggered',
        sensorName,
        timestamp: new Date().toISOString(),
      }
    );
  }

  // Configurar listeners de notificaciones
  setupNotificationListeners(onNotificationReceived, onNotificationTapped) {
    // Listener para cuando se recibe una notificación (app en foreground)
    this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('📬 Notificación recibida:', notification);
      if (onNotificationReceived) {
        onNotificationReceived(notification);
      }
    });

    // Listener para cuando el usuario toca una notificación
    this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('👆 Usuario tocó notificación:', response);
      if (onNotificationTapped) {
        onNotificationTapped(response);
      }
    });
  }

  // Limpiar listeners
  removeNotificationListeners() {
    if (this.notificationListener) {
      Notifications.removeNotificationSubscription(this.notificationListener);
      this.notificationListener = null;
    }
    if (this.responseListener) {
      Notifications.removeNotificationSubscription(this.responseListener);
      this.responseListener = null;
    }
  }

  // Cancelar todas las notificaciones programadas
  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  // Obtener todas las notificaciones programadas
  async getAllScheduledNotifications() {
    return await Notifications.getAllScheduledNotificationsAsync();
  }
}

export const notificationService = new NotificationService();
export default notificationService;
