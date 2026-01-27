# Configuración MQTT sobre TLS (Puerto 8883)

## 🔒 Implementación TLS/SSL

El firmware ahora soporta MQTT sobre TLS/SSL usando el puerto 8883.

## ⚙️ Configuración

### Variables de Configuración

En `home_alarm_central.ino`:

```cpp
const char* MQTT_BROKER = "44.221.95.191";  // IP del broker MQTT
const int MQTT_PORT = 8883;  // Puerto TLS/SSL para MQTT
const bool MQTT_USE_TLS = true;  // Habilitar TLS/SSL
const char* MQTT_USERNAME = "flowsight";  // Usuario MQTT (por dispositivo)
const char* MQTT_PASSWORD = "mqtt_password";  // Contraseña MQTT (por dispositivo)
const char* MQTT_CA_CERT = "";  // Certificado CA (vacío = sin verificación)
```

### Autenticación por Dispositivo

✅ **Sí, se implementa autenticación por usuario/password por dispositivo:**

- Cada dispositivo tiene su propio `MQTT_USERNAME` y `MQTT_PASSWORD`
- Puedes configurar credenciales diferentes para cada dispositivo
- El broker MQTT debe estar configurado para aceptar estas credenciales

## 🔐 Seguridad

### Opción 1: Sin Verificación de Certificado (Desarrollo)

```cpp
const char* MQTT_CA_CERT = "";  // Vacío = sin verificación
```

- ⚠️ **Solo para desarrollo**
- No verifica el certificado del servidor
- Más rápido pero menos seguro

### Opción 2: Con Verificación de Certificado (Producción)

```cpp
const char* MQTT_CA_CERT = R"(
-----BEGIN CERTIFICATE-----
MIIDXTCCAkWgAwIBAgIJAK...
-----END CERTIFICATE-----
)";
```

- ✅ **Recomendado para producción**
- Verifica que el servidor sea legítimo
- Protege contra ataques man-in-the-middle

## 📝 Obtener el Certificado CA

### Desde el Broker MQTT

Si el broker usa un certificado autofirmado o de una CA específica:

```bash
# Conectar al broker y obtener el certificado
openssl s_client -showcerts -connect 44.221.95.191:8883 </dev/null 2>/dev/null | openssl x509 -outform PEM > ca_cert.pem
```

### Si el Broker Usa Let's Encrypt

El certificado CA de Let's Encrypt es público:

```cpp
const char* MQTT_CA_CERT = R"(
-----BEGIN CERTIFICATE-----
MIIFazCCA1OgAwIBAgIRAIIQz7DSQONZRGPgu2OCiwAwDQYJKoZIhvcNAQELBQAw
...
-----END CERTIFICATE-----
)";
```

Puedes descargarlo de: https://letsencrypt.org/certificates/

## 🔄 Cambiar entre TLS y No-TLS

### Habilitar TLS

```cpp
const int MQTT_PORT = 8883;
const bool MQTT_USE_TLS = true;
```

### Deshabilitar TLS (solo desarrollo)

```cpp
const int MQTT_PORT = 1883;
const bool MQTT_USE_TLS = false;
```

## 👤 Configurar Usuario/Password por Dispositivo

### Dispositivo 1 (Central de Alarma)

```cpp
const char* MQTT_USERNAME = "home_alarm_central_001";
const char* MQTT_PASSWORD = "password_segura_001";
const char* DEVICE_ID = "home_alarm_central_001";
```

### Dispositivo 2 (Sensor)

```cpp
const char* MQTT_USERNAME = "sensor_escalera_001";
const char* MQTT_PASSWORD = "password_segura_002";
const char* DEVICE_ID = "sensor_escalera_001";
```

## 🔧 Configuración del Broker

### Aedes MQTT Broker (Node.js)

El broker debe estar configurado para:

1. **Escuchar en puerto 8883 con TLS:**
```javascript
const fs = require('fs');
const tls = require('tls');

const options = {
  key: fs.readFileSync('server-key.pem'),
  cert: fs.readFileSync('server-cert.pem'),
  ca: fs.readFileSync('ca-cert.pem')  // Opcional
};

const tlsServer = tls.createServer(options, (socket) => {
  aedes.handle(socket);
});

tlsServer.listen(8883, () => {
  console.log('MQTT TLS server listening on port 8883');
});
```

2. **Autenticación por usuario/password:**
```javascript
aedes.authenticate = (client, username, password, callback) => {
  // Verificar credenciales por dispositivo
  const passwordStr = password ? password.toString() : '';
  
  // Base de datos de usuarios (ejemplo)
  const users = {
    'home_alarm_central_001': 'password_segura_001',
    'sensor_escalera_001': 'password_segura_002',
    // ...
  };
  
  if (users[username] === passwordStr) {
    callback(null, true);
  } else {
    callback(new Error('Credenciales inválidas'), false);
  }
};
```

## ✅ Verificación

### Logs del ESP32

Al iniciar, deberías ver:

```
🔒 MQTT configurado con TLS/SSL (puerto 8883)
⚠️ Verificación de certificado DESHABILITADA (solo desarrollo)
🔌 Conectando a MQTT... Broker: 44.221.95.191:8883 Usuario: flowsight...
   Autenticación: Usuario=flowsight (por dispositivo)
✅ MQTT conectado con TLS!
```

### Probar Conexión

```bash
# Con mosquitto client
mosquitto_pub -h 44.221.95.191 -p 8883 \
  --cafile ca-cert.pem \
  -u flowsight -P mqtt_password \
  -t flowsight/home-alarm/central/command \
  -m '{"command":"arm","value":true}'
```

## 🐛 Solución de Problemas

### Error: "Certificate verification failed"

- Verifica que el certificado CA sea correcto
- O deshabilita la verificación temporalmente para desarrollo

### Error: "Connection timeout"

- Verifica que el puerto 8883 esté abierto en el firewall
- Verifica que el broker esté escuchando en el puerto 8883

### Error: "Bad credentials"

- Verifica que el usuario y contraseña coincidan con el broker
- Verifica que el broker acepte estas credenciales

## 📚 Referencias

- [ESP32 WiFiClientSecure](https://github.com/espressif/arduino-esp32/blob/master/libraries/WiFi/src/WiFiClientSecure.h)
- [PubSubClient TLS](https://github.com/knolleary/pubsubclient)
- [MQTT over TLS](https://www.hivemq.com/blog/mqtt-security-fundamentals-tls-ssl/)
