# Firmware HTTP para Central de Alarma

Este firmware usa **HTTP requests** en lugar de MQTT para comunicarse con el backend.

## 📁 Archivos

- **`home_alarm_central_http/home_alarm_central_http.ino`** - Firmware HTTP (Arduino IDE)
- **`home_alarm_central/home_alarm_central/home_alarm_central.ino`** - Firmware MQTT original (mantener intacto)

## 🔧 Configuración

### 1. WiFi

```cpp
const char* WIFI_SSID = "Tu_SSID";
const char* WIFI_PASSWORD = "Tu_Password";
```

### 2. Backend API

```cpp
const char* API_BASE_URL = "https://puntopedido.com.ar";
const char* API_KEY = "device_api_key_here";  // Configurar en backend
const char* DEVICE_ID = "home_alarm_central_001";
```

### 3. API Key

La API Key debe configurarse en el backend:

**Archivo:** `backend/.env`

```env
DEVICE_001_API_KEY=tu_api_key_secreta_aqui
```

O en `backend/src/controllers/homeAlarmDevice.controller.js`:

```javascript
const VALID_API_KEYS = {
  'home_alarm_central_001': 'tu_api_key_secreta_aqui',
  // ...
};
```

## 📡 Endpoints HTTP

El firmware se comunica con estos endpoints:

### Enviar Datos (POST)

1. **Estado de la central**
   - `POST /api/home-alarm/device/status`
   - Enviado cada 30 segundos

2. **Heartbeat**
   - `POST /api/home-alarm/device/heartbeat`
   - Enviado cada 60 segundos

3. **Triggers (sensores/tamper)**
   - `POST /api/home-alarm/device/trigger`
   - Enviado cuando hay eventos

4. **Datos de sensores**
   - `POST /api/home-alarm/device/sensor-data`
   - Enviado cuando los sensores ESP-NOW reportan datos

### Obtener Comandos (GET - Polling)

5. **Comandos pendientes**
   - `GET /api/home-alarm/device/commands`
   - Consultado cada 5 segundos
   - Retorna comandos pendientes desde la base de datos

## 🔐 Autenticación

Todos los requests incluyen headers:

```
X-API-Key: device_api_key_here
X-Device-ID: home_alarm_central_001
```

## 🚀 Uso

1. **Cargar firmware en Arduino IDE**
   - Abrir `home_alarm_central_http.ino`
   - Configurar WiFi y API_KEY
   - Subir a ESP32

2. **Configurar backend**
   - Ejecutar `database/add_device_commands_table.sql`
   - Configurar API_KEY en backend
   - Reiniciar backend

3. **Verificar conexión**
   - El firmware enviará estado cada 30 segundos
   - El backend recibirá los datos y los guardará en BD
   - Los comandos desde la app se guardarán en `device_commands`
   - El firmware los obtendrá mediante polling cada 5 segundos

## 🔄 Flujo de Comandos

1. Usuario ejecuta acción en app (arm/disarm/siren)
2. Backend guarda comando en tabla `device_commands`
3. Firmware hace polling cada 5 segundos
4. Backend retorna comando pendiente
5. Firmware ejecuta comando
6. Firmware envía confirmación (opcional)

## ⚙️ Parámetros Ajustables

```cpp
const int HTTP_TIMEOUT = 10000;  // Timeout HTTP (ms)
const int COMMAND_POLL_INTERVAL = 5000;  // Polling de comandos (ms)
const int HEARTBEAT_INTERVAL = 60000;  // Heartbeat (ms)
const int STATUS_UPDATE_INTERVAL = 30000;  // Actualización de estado (ms)
```

## 🔍 Debugging

El firmware imprime en Serial:

- `✅ HTTP POST /api/home-alarm/device/status: 200` - Éxito
- `❌ HTTP POST /api/home-alarm/device/status: 401` - Error de autenticación
- `📥 Comando recibido: arm = true` - Comando obtenido

## 📊 Base de Datos

El backend requiere la tabla `device_commands`:

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
    expires_at TIMESTAMP NULL
);
```

Ejecutar: `database/add_device_commands_table.sql`

## ⚠️ Notas

- El firmware HTTP usa HTTPS (puerto 443) con verificación de certificado deshabilitada (desarrollo)
- Para producción, configurar certificados SSL válidos
- El polling de comandos consume más ancho de banda que MQTT
- Los comandos expiran después de 5 minutos si no se procesan
