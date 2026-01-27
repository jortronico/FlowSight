# FlowSight MQTT Broker

Broker MQTT personalizado con soporte para TLS/SSL y autenticación por dispositivo.

## 🚀 Características

- ✅ **MQTT sobre TCP** (puerto 1883)
- ✅ **MQTT sobre TLS/SSL** (puerto 8883)
- ✅ **WebSocket MQTT** (puerto 8083)
- ✅ **Autenticación por dispositivo** (usuario/password único por dispositivo)
- ✅ **Autorización de topics** (solo topics que empiezan con `flowsight/`)
- ✅ **API de estadísticas** (puerto 8084)

## 📦 Instalación

```bash
cd mqtt-broker
npm install
```

## ⚙️ Configuración

### 1. Crear archivo `.env`

Copia `.env.example` a `.env` y configura:

```bash
# Puertos
MQTT_PORT=1883
MQTT_TLS_PORT=8883
MQTT_WS_PORT=8083

# Habilitar TLS
MQTT_USE_TLS=true

# Autenticación
MQTT_USERNAME=flowsight
MQTT_PASSWORD=mqtt_password

# Contraseñas por dispositivo
DEVICE_001_PASSWORD=password_dispositivo_1
SENSOR_ESCALERA_PASSWORD=password_sensor_escalera
SENSOR_SALA_PASSWORD=password_sensor_sala

# Entorno
NODE_ENV=production
```

### 2. Generar Certificados SSL (para TLS)

```bash
# Opción 1: Usar el script
chmod +x generar-certificados.sh
./generar-certificados.sh

# Opción 2: Manual
mkdir -p certs
cd certs
openssl genrsa -out server-key.pem 2048
openssl req -new -x509 -days 365 -key server-key.pem -out server-cert.pem \
  -subj "/C=AR/ST=BuenosAires/L=BuenosAires/O=FlowSight/CN=44.221.95.191"
chmod 600 server-key.pem
chmod 644 server-cert.pem
```

Ver `GENERAR_CERTIFICADOS.md` para más detalles.

## 🏃 Ejecutar

```bash
# Producción
npm start

# Desarrollo (con auto-reload)
npm run dev
```

## 🔐 Autenticación por Dispositivo

El broker soporta autenticación por usuario/password por dispositivo:

### Configurar Usuarios

Edita `src/index.js` o usa variables de entorno:

```javascript
const users = {
  'flowsight': 'mqtt_password',  // Usuario por defecto
  'home_alarm_central_001': 'password_dispositivo_1',
  'sensor_escalera_001': 'password_sensor_escalera',
  // Agregar más dispositivos...
};
```

### Usar desde el Firmware

```cpp
const char* MQTT_USERNAME = "home_alarm_central_001";
const char* MQTT_PASSWORD = "password_dispositivo_1";
```

## 🔒 TLS/SSL

### Habilitar TLS

1. Genera certificados SSL (ver `GENERAR_CERTIFICADOS.md`)
2. Colócalos en `certs/`:
   - `server-key.pem`
   - `server-cert.pem`
   - `ca-cert.pem` (opcional)
3. Configura `MQTT_USE_TLS=true` en `.env`
4. Reinicia el broker

### Verificar TLS

```bash
# Probar conexión TLS
openssl s_client -connect 44.221.95.191:8883 -showcerts
```

## 📊 API de Estadísticas

```bash
# Obtener estadísticas
curl http://localhost:8084/stats

# Health check
curl http://localhost:8084/health
```

## 🔥 Firewall AWS

Asegúrate de abrir estos puertos en el Security Group:

- **1883** (TCP) - MQTT sin TLS
- **8883** (TCP) - MQTT con TLS
- **8083** (TCP) - WebSocket MQTT
- **8084** (TCP) - API de estadísticas

## 🐛 Solución de Problemas

### TLS no funciona

- Verifica que los certificados existan en `certs/`
- Verifica permisos: `chmod 600 certs/server-key.pem`
- Revisa los logs del broker

### Autenticación falla

- Verifica usuario y contraseña en el código del firmware
- Verifica que el usuario esté en la lista de `users` en `index.js`
- Revisa los logs del broker para ver qué usuario intenta conectarse

### Puerto bloqueado

- Verifica el Security Group de AWS
- Verifica el firewall de la instancia EC2
- Prueba con `telnet 44.221.95.191 8883`

## 📚 Referencias

- [Aedes MQTT Broker](https://github.com/moscajs/aedes)
- [Node.js TLS](https://nodejs.org/api/tls.html)
- [MQTT Protocol](https://mqtt.org/)
