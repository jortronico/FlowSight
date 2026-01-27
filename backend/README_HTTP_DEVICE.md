# Backend - Soporte para Dispositivos HTTP

El backend ahora soporta comunicación con dispositivos vía HTTP además de MQTT.

## 📡 Endpoints para Dispositivos

### Autenticación

Todos los endpoints requieren headers:

```
X-API-Key: device_api_key_here
X-Device-ID: home_alarm_central_001
```

### Endpoints

#### 1. Recibir Estado
```
POST /api/home-alarm/device/status
```

Recibe el estado completo de la central de alarma.

**Body:**
```json
{
  "device_id": "home_alarm_central_001",
  "alarm_armed": false,
  "siren_active": false,
  "siren_state": 0,
  "tamper_triggered": false,
  "tamper_state": 0,
  "wifi_rssi": -45,
  "uptime": 3600,
  "free_heap": 150000,
  "timestamp": 1234567890
}
```

#### 2. Recibir Heartbeat
```
POST /api/home-alarm/device/heartbeat
```

Recibe heartbeat periódico de la central.

**Body:**
```json
{
  "device_id": "home_alarm_central_001",
  "alarm_armed": false,
  "siren_active": false,
  "siren_state": 0,
  "tamper_triggered": false,
  "tamper_state": 0,
  "wifi_rssi": -45,
  "uptime": 3600,
  "timestamp": 1234567890
}
```

#### 3. Recibir Trigger
```
POST /api/home-alarm/device/trigger
```

Recibe eventos de triggers (sensores o tamper).

**Body (Sensor):**
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

**Body (Tamper):**
```json
{
  "device_id": "home_alarm_central_001",
  "event_type": "tamper_activated",
  "tamper_triggered": true,
  "tamper_state": 1,
  "alarm_armed": false,
  "message": "Tamper switch activado",
  "timestamp": 1234567890
}
```

#### 4. Recibir Datos de Sensor
```
POST /api/home-alarm/device/sensor-data
```

Recibe datos de sensores ESP-NOW.

**Body:**
```json
{
  "device_id": "home_alarm_central_001",
  "sensor_id": 1,
  "sensor_name": "escalera",
  "triggered": false,
  "rssi": -60,
  "timestamp": 1234567890
}
```

#### 5. Obtener Comandos (Polling)
```
GET /api/home-alarm/device/commands
```

El dispositivo consulta comandos pendientes.

**Response (con comando):**
```json
{
  "success": true,
  "has_command": true,
  "command": "arm",
  "value": true,
  "command_id": 123,
  "metadata": null
}
```

**Response (sin comando):**
```json
{
  "success": true,
  "has_command": false,
  "command": null,
  "value": null
}
```

#### 6. Confirmar Comando (Opcional)
```
POST /api/home-alarm/device/commands/confirm
```

El dispositivo confirma la ejecución de un comando.

**Body:**
```json
{
  "command_id": 123,
  "success": true
}
```

## 🔐 Configuración de API Keys

### Opción 1: Variables de Entorno

**Archivo:** `backend/.env`

```env
DEVICE_001_API_KEY=tu_api_key_secreta_aqui
SENSOR_ESCALERA_API_KEY=sensor_escalera_key
SENSOR_SALA_API_KEY=sensor_sala_key
```

### Opción 2: Código

**Archivo:** `backend/src/controllers/homeAlarmDevice.controller.js`

```javascript
const VALID_API_KEYS = {
  'home_alarm_central_001': process.env.DEVICE_001_API_KEY || 'device_api_key_here',
  'sensor_escalera_001': process.env.SENSOR_ESCALERA_API_KEY || 'sensor_escalera_key',
  'sensor_sala_001': process.env.SENSOR_SALA_API_KEY || 'sensor_sala_key'
};
```

## 🗄️ Base de Datos

### Tabla: `device_commands`

Almacena comandos pendientes para dispositivos HTTP.

```sql
CREATE TABLE device_commands (
    id INT PRIMARY KEY AUTO_INCREMENT,
    device_id VARCHAR(100) NOT NULL,
    command VARCHAR(50) NOT NULL,
    value TEXT,
    status ENUM('pending', 'sent', 'executed', 'failed') DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    sent_at TIMESTAMP NULL,
    executed_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    metadata JSON,
    INDEX idx_device (device_id),
    INDEX idx_status (status),
    INDEX idx_created (created_at)
);
```

**Ejecutar:** `database/add_device_commands_table.sql`

## 🔄 Flujo de Comandos

1. **Usuario ejecuta acción** (arm/disarm/siren) desde app web/mobile
2. **Backend guarda comando** en `device_commands` con `status='pending'`
3. **Dispositivo hace polling** cada 5 segundos a `/api/home-alarm/device/commands`
4. **Backend retorna comando** y marca como `status='sent'`
5. **Dispositivo ejecuta comando** y opcionalmente confirma
6. **Backend marca como** `status='executed'` o `status='failed'`

## 📝 Crear Comandos desde el Backend

El controlador `homeAlarm.controller.js` crea comandos automáticamente:

```javascript
// Función auxiliar
const createDeviceCommand = async (deviceId, command, value, metadata = null) => {
  await db.execute(
    `INSERT INTO device_commands (device_id, command, value, metadata, expires_at) 
     VALUES (?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL 5 MINUTE))`,
    [deviceId, command, String(value), metadata ? JSON.stringify(metadata) : null]
  );
};

// Ejemplo: Al activar alarma
await createDeviceCommand('home_alarm_central_001', 'arm', true);
```

## 🔍 Debugging

### Ver comandos pendientes

```sql
SELECT * FROM device_commands 
WHERE device_id = 'home_alarm_central_001' 
  AND status = 'pending'
ORDER BY created_at DESC;
```

### Ver historial de comandos

```sql
SELECT * FROM device_commands 
WHERE device_id = 'home_alarm_central_001' 
ORDER BY created_at DESC 
LIMIT 10;
```

### Limpiar comandos expirados

```sql
DELETE FROM device_commands 
WHERE expires_at < NOW() 
  AND status = 'pending';
```

## ⚠️ Notas

- Los comandos expiran después de 5 minutos por defecto
- El dispositivo debe hacer polling regularmente (recomendado: cada 5 segundos)
- Los comandos se procesan en orden FIFO (primero en entrar, primero en salir)
- MQTT y HTTP pueden coexistir (el backend soporta ambos)

## 🚀 Próximos Pasos

1. ✅ Ejecutar `database/add_device_commands_table.sql`
2. ✅ Configurar API keys en `.env` o código
3. ✅ Cargar firmware HTTP en ESP32
4. ✅ Verificar que el dispositivo se conecta y envía estado
5. ✅ Probar comandos desde la app
