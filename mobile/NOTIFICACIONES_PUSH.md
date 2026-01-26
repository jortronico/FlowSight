# Notificaciones Push - Alarma de Hogar

Guía de implementación y uso de notificaciones push para cambios de estado de la alarma.

## 📱 Funcionalidades Implementadas

### Notificaciones Automáticas

La app envía notificaciones push automáticamente cuando:

1. **Estado de Alarma Cambia:**
   - 🔒 Alarma Activada
   - 🔓 Alarma Desactivada
   - 🚨 Alarma Disparada

2. **Tamper (Sabotaje):**
   - 🚨 TAMPER ACTIVADO - Switch de sabotaje detectado
   - ✅ Tamper Restaurado

3. **Sirena:**
   - 🔊 Sirena Activada
   - 🔇 Sirena Desactivada

4. **Sensores:**
   - 🚨 Sensor Activado - Cuando un sensor detecta movimiento

## 🔧 Instalación

### 1. Instalar Dependencias

```bash
cd mobile
npm install
```

Las dependencias necesarias ya están en `package.json`:
- `expo-notifications` - Para notificaciones push
- `expo-device` - Para verificar si es dispositivo físico

### 2. Configuración

El `app.json` ya está configurado con el plugin de notificaciones.

### 3. Permisos

La app solicitará permisos automáticamente al iniciar. En Android, los permisos se solicitan automáticamente. En iOS, se mostrará un diálogo.

## 📲 Uso

### Notificaciones Locales

Las notificaciones se envían automáticamente cuando:
- Cambia el estado de la alarma (vía Socket.IO)
- Se activa/desactiva el tamper
- Se activa/desactiva la sirena
- Un sensor detecta movimiento

### Notificaciones en Background

Las notificaciones funcionan incluso cuando:
- La app está en segundo plano
- La app está cerrada (en algunos casos)
- El dispositivo está bloqueado

### Interacción con Notificaciones

- **Tocar notificación**: Abre la app (puedes personalizar la navegación)
- **Deslizar**: Descarta la notificación
- **Sonido**: Se reproduce automáticamente
- **Vibración**: Se activa para eventos críticos

## 🎯 Eventos que Disparan Notificaciones

### Desde Socket.IO

1. `home_alarm:status` - Cambio de estado general
2. `home_alarm:event` - Eventos específicos:
   - `armed` → Notificación de activación
   - `disarmed` → Notificación de desactivación
   - `triggered` → Notificación de alarma disparada
   - `tamper_activated` → Notificación de tamper
   - `tamper_restored` → Notificación de tamper restaurado
   - `siren_on` → Notificación de sirena activada
   - `siren_off` → Notificación de sirena desactivada
3. `home_alarm:central_status` - Cambios desde la central física
4. `home_alarm:trigger` - Sensor activado

## 🔔 Tipos de Notificaciones

### 1. Cambio de Estado de Alarma
```javascript
notificationService.notifyAlarmStatusChange('armed', 'Alarma activada');
```

### 2. Tamper
```javascript
notificationService.notifyTamper(true);  // Activado
notificationService.notifyTamper(false); // Restaurado
```

### 3. Sirena
```javascript
notificationService.notifySiren(true);  // Activada
notificationService.notifySiren(false); // Desactivada
```

### 4. Sensor Activado
```javascript
notificationService.notifySensorTriggered('Sensor Escalera');
```

## ⚙️ Configuración Avanzada

### Personalizar Sonidos

Edita `mobile/src/services/notifications.js`:

```javascript
await Notifications.scheduleNotificationAsync({
  content: {
    title,
    body,
    sound: 'default', // O nombre de archivo de sonido personalizado
  },
  trigger: null,
});
```

### Personalizar Prioridad (Android)

```javascript
priority: Notifications.AndroidNotificationPriority.HIGH, // o MAX
```

### Notificaciones Programadas

```javascript
// Programar notificación para más tarde
await Notifications.scheduleNotificationAsync({
  content: {
    title: 'Recordatorio',
    body: 'Revisar estado de alarma',
  },
  trigger: {
    seconds: 3600, // En 1 hora
  },
});
```

## 🐛 Solución de Problemas

### Las notificaciones no aparecen

1. **Verificar permisos:**
   - Android: Configuración → Apps → FlowSight → Notificaciones
   - iOS: Configuración → Notificaciones → FlowSight

2. **Verificar que es dispositivo físico:**
   - Las notificaciones no funcionan en emuladores/simuladores
   - Solo funcionan en dispositivos físicos

3. **Revisar logs:**
   ```bash
   npx expo start
   # Revisar consola para mensajes de permisos
   ```

### Notificaciones no suenan

1. Verificar que el dispositivo no esté en modo silencioso
2. Verificar volumen del dispositivo
3. Verificar configuración de sonido en la app

### Notificaciones duplicadas

- Las notificaciones se envían desde múltiples listeners
- Verificar que no haya listeners duplicados en `HomeAlarmScreen`

## 📚 Recursos

- [Documentación Expo Notifications](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [Guía de Notificaciones Push](https://docs.expo.dev/push-notifications/overview/)

## ✅ Checklist

- [x] Dependencias instaladas
- [x] Permisos configurados
- [x] Servicio de notificaciones creado
- [x] Listeners configurados en HomeAlarmScreen
- [x] Notificaciones para todos los eventos
- [x] Vibración háptica integrada

¡Las notificaciones push están listas! 🎉
