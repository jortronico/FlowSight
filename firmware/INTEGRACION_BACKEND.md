# Integración Backend - Firmware Central de Alarma

Este documento explica cómo el firmware de la central se integra con el backend de FlowSight.

## Flujo de Comunicación

```
[Móvil/Web] → [Backend API] → [MQTT Broker] → [Central ESP32] → [Sensores ESP-NOW]
                                                      ↓
                                              [Sirena/LED]
```

## Topics MQTT

### Central → Backend (Publica)

1. **Estado de la Central**
   - Topic: `flowsight/home-alarm/central/status`
   - Frecuencia: Cada 30 segundos
   - Formato:
   ```json
   {
     "device_id": "home_alarm_central_001",
     "alarm_armed": false,
     "siren_active": false,
     "wifi_rssi": -45,
     "uptime": 3600,
     "free_heap": 250000,
     "timestamp": 1234567890
   }
   ```

2. **Heartbeat**
   - Topic: `flowsight/home-alarm/central/heartbeat`
   - Frecuencia: Cada 60 segundos
   - Formato: Similar a status

3. **Datos de Sensores**
   - Topic: `flowsight/home-alarm/sensors/data`
   - Frecuencia: Cuando sensor detecta cambio
   - Formato:
   ```json
   {
     "sensor_id": 1,
     "sensor_name": "escalera",
     "triggered": true,
     "rssi": -65,
     "timestamp": 1234567890,
     "device_id": "home_alarm_central_001"
   }
   ```

4. **Alarma Disparada**
   - Topic: `flowsight/home-alarm/central/trigger`
   - Frecuencia: Cuando alarma armada y sensor se activa
   - Formato:
   ```json
   {
     "device_id": "home_alarm_central_001",
     "sensor_id": 1,
     "sensor_name": "escalera",
     "triggered": true,
     "alarm_armed": true,
     "timestamp": 1234567890
   }
   ```

### Backend → Central (Suscribe)

1. **Comandos de Control**
   - Topic: `flowsight/home-alarm/central/command`
   - Formato:
   ```json
   {
     "command": "arm",    // "arm" o "siren"
     "value": true,       // true/false
     "timestamp": "2024-01-01T00:00:00.000Z"
   }
   ```

## Integración en el Backend

El backend ya está configurado para:

1. **Recibir mensajes MQTT** de la central
2. **Emitir eventos Socket.IO** cuando llegan datos
3. **Enviar comandos MQTT** cuando el usuario activa/desactiva desde la app

### Archivos Modificados

- `backend/src/services/mqtt.service.js`
  - Suscribe a topics de home alarm
  - Handlers para procesar mensajes
  - Método `publishHomeAlarmCommand()` para enviar comandos

- `backend/src/controllers/homeAlarm.controller.js`
  - Envía comandos MQTT cuando usuario activa/desactiva
  - Integrado con `mqttService`

## Eventos Socket.IO

El backend emite estos eventos cuando recibe datos MQTT:

- `home_alarm:central_status` - Estado de la central
- `home_alarm:sensor_data` - Datos de sensores
- `home_alarm:trigger` - Alarma disparada
- `home_alarm:heartbeat` - Heartbeat de la central

## Pruebas

### 1. Verificar que el backend recibe mensajes

```bash
# En el backend, deberías ver logs como:
🏠 Estado central alarma: { device_id: '...', ... }
📡 Datos sensor alarma: { sensor_id: 1, ... }
🚨 Alarma disparada: { ... }
```

### 2. Probar comando desde la app móvil

1. Abrir app móvil
2. Ir a "Alarma Hogar"
3. Activar alarma
4. Verificar que la central recibe el comando MQTT

### 3. Probar detección de sensor

1. Activar alarma desde la app
2. Activar sensor PIR físicamente
3. Verificar que:
   - Sensor envía por ESP-NOW a central
   - Central publica por MQTT
   - Backend recibe y emite evento Socket.IO
   - App móvil recibe notificación en tiempo real

## Debugging

### Ver mensajes MQTT en tiempo real

```bash
# Instalar mosquitto-clients
npm install -g mosquitto-clients

# Suscribirse a todos los topics
mosquitto_sub -h localhost -p 1883 -u flowsight -P mqtt_password -t "flowsight/home-alarm/#" -v
```

### Verificar conexión de la central

1. Revisar Serial Monitor de la central
2. Debería mostrar:
   - ✅ WiFi conectado
   - ✅ MQTT conectado
   - 📥 Suscrito a: flowsight/home-alarm/central/command

### Verificar que backend envía comandos

En el backend, cuando activas la alarma, deberías ver:
```
📤 Comando enviado a central: arm = true
```

## Configuración de Red

Asegúrate de que:

1. **Central ESP32** y **Backend** estén en la misma red
2. **MQTT Broker** esté accesible desde la red local
3. **IP del broker** esté correcta en el firmware
4. **Credenciales MQTT** coincidan

## Troubleshooting

### La central no recibe comandos

- Verifica que el backend esté suscrito al topic correcto
- Verifica que `mqttService.publishHomeAlarmCommand()` se esté llamando
- Verifica credenciales MQTT
- Revisa Serial Monitor de la central

### El backend no recibe datos

- Verifica que la central esté publicando
- Verifica topics correctos
- Verifica que el broker esté corriendo
- Usa `mosquitto_sub` para verificar mensajes

### Sensores no funcionan

- Verifica MAC addresses en el firmware
- Verifica que sensores estén enviando por ESP-NOW
- Revisa Serial Monitor de sensores
- Verifica rango ESP-NOW (máx 100-200m)
