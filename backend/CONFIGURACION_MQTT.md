# Configuración MQTT - Backend

## 🌐 Broker MQTT en AWS

El broker MQTT está corriendo en una instancia EC2 de AWS:

- **IP**: `44.221.95.191`
- **Puerto**: `1883`
- **Instancia**: `api-alarma`
- **Usuario**: `flowsight`
- **Contraseña**: `mqtt_password`

## ⚙️ Configuración

### Variables de Entorno

Crea o actualiza tu archivo `.env` en `backend/`:

```bash
# Broker MQTT
MQTT_BROKER_HOST=44.221.95.191
MQTT_PORT=1883
MQTT_USERNAME=flowsight
MQTT_PASSWORD=mqtt_password
```

### Archivo de Configuración

El archivo `backend/src/config/mqtt.js` ya está configurado para usar estas variables:

```javascript
module.exports = {
  broker: {
    host: process.env.MQTT_BROKER_HOST || 'localhost',
    port: parseInt(process.env.MQTT_PORT) || 1883,
    username: process.env.MQTT_USERNAME || 'flowsight',
    password: process.env.MQTT_PASSWORD || 'mqtt_password'
  },
  // ...
};
```

## ✅ Verificación

### 1. Verificar Conexión

Al iniciar el backend, deberías ver:

```
✅ Conectado al broker MQTT
📡 Suscrito a: flowsight/home-alarm/central/status
📡 Suscrito a: flowsight/home-alarm/sensors/data
...
```

### 2. Probar Conexión Manualmente

```bash
# Desde la terminal
telnet 44.221.95.191 1883

# O con Node.js
node -e "const mqtt = require('mqtt'); const client = mqtt.connect('mqtt://44.221.95.191:1883', {username: 'flowsight', password: 'mqtt_password'}); client.on('connect', () => {console.log('✅ Conectado'); client.end();});"
```

## 🔒 Seguridad

### Credenciales

- **Nunca** commitees el archivo `.env` al repositorio
- Usa credenciales fuertes en producción
- Considera usar AWS Secrets Manager para credenciales

### Firewall

Asegúrate de que el Security Group de la instancia EC2 permita conexiones en el puerto 1883 desde:
- La IP del servidor donde corre el backend
- O desde cualquier IP si es necesario (menos seguro)

## 📊 Topics MQTT

El backend se suscribe a los siguientes topics:

- `flowsight/home-alarm/central/status` - Estado de la central
- `flowsight/home-alarm/sensors/data` - Datos de sensores
- `flowsight/home-alarm/central/trigger` - Alarmas disparadas
- `flowsight/home-alarm/central/heartbeat` - Heartbeat de la central
- `flowsight/alarms/+/trigger` - Alarmas generales
- `flowsight/valves/+/status` - Estado de válvulas
- `flowsight/devices/+/heartbeat` - Heartbeat de dispositivos

Y publica en:

- `flowsight/home-alarm/central/command` - Comandos a la central

## 🐛 Solución de Problemas

### Error: "ECONNREFUSED"

- Verifica que el broker esté corriendo en AWS
- Verifica que el puerto 1883 esté abierto en el Security Group
- Verifica que la IP sea correcta

### Error: "Authentication failed"

- Verifica las credenciales en `.env`
- Verifica que el usuario y contraseña coincidan con el broker

### Error: "Network timeout"

- Verifica tu conexión a internet
- Verifica que la instancia EC2 esté accesible
- Verifica que no haya un firewall bloqueando

## 🔄 Cambiar la IP del Broker

Si necesitas cambiar la IP:

1. Actualiza `MQTT_BROKER_HOST` en `.env`
2. Reinicia el backend
3. Verifica los logs de conexión

## 📚 Referencias

- [MQTT.js Documentation](https://github.com/mqttjs/MQTT.js)
- [AWS EC2 Security Groups](https://docs.aws.amazon.com/AEC2/latest/UserGuide/working-with-security-groups.html)
