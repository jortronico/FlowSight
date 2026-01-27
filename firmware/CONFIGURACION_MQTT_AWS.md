# Configuración del Broker MQTT - AWS EC2

## 🌐 Información del Broker

- **IP del Broker**: `44.221.95.191`
- **Puerto**: `1883`
- **Ubicación**: AWS EC2 - Instancia `api-alarma`
- **Usuario**: `flowsight`
- **Contraseña**: `mqtt_password`

## 📝 Archivos Actualizados

### Firmware ESP32

1. **Arduino IDE** (`home_alarm_central.ino`):
   ```cpp
   const char* MQTT_BROKER = "44.221.95.191";  // IP del broker MQTT (AWS EC2 - api-alarma)
   ```

2. **PlatformIO** (`src/main.cpp`):
   ```cpp
   const char* MQTT_BROKER = "44.221.95.191";  // IP del broker MQTT (AWS EC2 - api-alarma)
   ```

3. **PlatformIO Config** (`src/config.h`):
   ```cpp
   #define MQTT_BROKER "44.221.95.191"  // IP del servidor MQTT (AWS EC2 - api-alarma)
   ```

### Backend Node.js

El backend usa variables de entorno. Configura en tu archivo `.env`:

```bash
MQTT_BROKER_HOST=44.221.95.191
MQTT_PORT=1883
MQTT_USERNAME=flowsight
MQTT_PASSWORD=mqtt_password
```

## ✅ Verificación

### 1. Verificar Conectividad

Desde tu máquina local, prueba la conexión:

```bash
# Verificar que el puerto esté abierto
telnet 44.221.95.191 1883

# O con netcat
nc -zv 44.221.95.191 1883
```

### 2. Verificar desde el ESP32

Después de cargar el firmware, revisa el Serial Monitor:

```
✅ Conectado al broker MQTT
📡 Suscrito a: flowsight/home-alarm/central/command
```

### 3. Verificar desde el Backend

Revisa los logs del backend:

```
✅ Conectado al broker MQTT
📡 Suscrito a: flowsight/home-alarm/central/status
```

## 🔒 Seguridad AWS

### Configuración del Security Group

Asegúrate de que el Security Group de la instancia EC2 tenga:

- **Puerto 1883 (TCP)** abierto desde:
  - Tu IP pública (para desarrollo)
  - O desde cualquier IP (0.0.0.0/0) si es necesario

### Configuración del Firewall

Si usas un firewall en la instancia EC2:

```bash
# Ubuntu/Debian
sudo ufw allow 1883/tcp

# CentOS/RHEL
sudo firewall-cmd --permanent --add-port=1883/tcp
sudo firewall-cmd --reload
```

## 🔄 Cambiar la IP del Broker

Si necesitas cambiar la IP en el futuro:

1. **Firmware Arduino**: Edita `home_alarm_central.ino`
2. **Firmware PlatformIO**: Edita `src/main.cpp` o `src/config.h`
3. **Backend**: Actualiza `MQTT_BROKER_HOST` en `.env`

## 📊 Monitoreo

### Verificar Estado del Broker

Si el broker tiene una API de estadísticas:

```bash
curl http://44.221.95.191:8084/stats
```

### Verificar Conexiones Activas

Revisa los logs del broker en AWS:

```bash
# SSH a la instancia EC2
ssh usuario@44.221.95.191

# Ver logs del broker MQTT
# (depende de cómo esté corriendo el broker)
```

## 🐛 Solución de Problemas

### Error: "Connection refused"

- Verifica que el puerto 1883 esté abierto en el Security Group
- Verifica que el firewall de la instancia permita el puerto
- Verifica que el broker MQTT esté corriendo en la instancia

### Error: "Network unreachable"

- Verifica que la IP pública sea correcta
- Verifica que la instancia EC2 esté corriendo
- Verifica tu conexión a internet

### Error: "Authentication failed"

- Verifica usuario y contraseña en el firmware
- Verifica que las credenciales coincidan con el broker

## 📚 Referencias

- [Documentación MQTT](https://mqtt.org/)
- [AWS EC2 Security Groups](https://docs.aws.amazon.com/AEC2/latest/UserGuide/working-with-security-groups.html)
- [Aedes MQTT Broker](https://github.com/moscajs/aedes)
