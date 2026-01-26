# Firmware - Central de Alarma FlowSight

Firmware para ESP32 que implementa la central de alarma del sistema FlowSight.

## Características

- ✅ **ESP32** con WiFi
- ✅ **FreeRTOS** para tareas concurrentes
- ✅ **ESP-NOW** para comunicación con sensores de presencia
- ✅ **MQTT** para comunicación con el backend
- ✅ Control de sirena principal
- ✅ LED de vigía (indica alarma armada)
- ✅ 2 sensores de presencia (escalera y sala de entrada)

## Hardware Requerido

- ESP32 (cualquier variante)
- Sirena 12V con relé o transistor
- LED indicador (vigía)
- Resistencias según necesidad
- Fuente de alimentación 5V para ESP32

## Conexiones

```
ESP32          Componente
------         ----------
GPIO 25  --->  Sirena (a través de relé/transistor)
GPIO 26  --->  LED Vigía (+ resistencia 220Ω)
GPIO 2   --->  LED Status WiFi (opcional)
GND      --->  GND común
VIN/5V   --->  Alimentación
```

## Configuración

### 1. Instalar PlatformIO

```bash
# Si usas VS Code, instala la extensión PlatformIO
# O instala PlatformIO CLI:
pip install platformio
```

### 2. Configurar WiFi y MQTT

Edita `src/config.h` o `src/main.cpp` con tus credenciales:

```cpp
const char* WIFI_SSID = "TU_WIFI_SSID";
const char* WIFI_PASSWORD = "TU_WIFI_PASSWORD";
const char* MQTT_BROKER = "192.168.0.14";  // IP de tu servidor
```

### 3. Configurar MAC de Sensores

En `src/main.cpp`, configura las MAC addresses de tus sensores:

```cpp
uint8_t sensorEscaleraMAC[] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0x01};
uint8_t sensorSalaMAC[] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0x02};
```

**Nota:** Para obtener la MAC de tus sensores, ejecuta el código de ejemplo en cada sensor y revisa el Serial Monitor.

### 4. Compilar y Subir

```bash
# Compilar
pio run

# Subir al ESP32
pio run --target upload

# Monitorear serial
pio device monitor
```

## Arquitectura FreeRTOS

El firmware usa 6 tareas principales:

1. **taskWiFiMQTT** (Core 1, Prioridad 2)
   - Maneja conexión WiFi
   - Maneja conexión MQTT
   - Publica estado periódicamente

2. **taskESPNow** (Core 0, Prioridad 3)
   - Recibe datos de sensores vía ESP-NOW
   - Procesa y publica por MQTT

3. **taskSirenControl** (Core 1, Prioridad 2)
   - Controla patrón de sirena
   - Patrón intermitente cuando está activa

4. **taskLEDControl** (Core 0, Prioridad 1)
   - Controla LED de vigía
   - Parpadea cuando alarma está armada

5. **taskAlarmLogic** (Core 1, Prioridad 3)
   - Procesa comandos MQTT
   - Lógica de activación/desactivación

6. **taskHeartbeat** (Core 0, Prioridad 1)
   - Publica heartbeat cada 60 segundos
   - Información de estado del sistema

## Topics MQTT

### Publica (Central → Broker)

- `flowsight/home-alarm/central/status` - Estado de la central
- `flowsight/home-alarm/central/heartbeat` - Heartbeat periódico
- `flowsight/home-alarm/sensors/data` - Datos de sensores
- `flowsight/home-alarm/central/trigger` - Alarma disparada

### Suscribe (Broker → Central)

- `flowsight/home-alarm/central/command` - Comandos de control

### Formato de Comandos

```json
{
  "command": "arm",      // "arm" o "siren"
  "value": true          // true/false
}
```

### Formato de Estado

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

## Comunicación ESP-NOW

Los sensores envían datos con el siguiente formato:

```cpp
struct SensorData {
  uint8_t mac[6];
  bool triggered;
  uint8_t sensor_id;  // 1 = escalera, 2 = sala
  int rssi;
  unsigned long timestamp;
};
```

## Funcionamiento

1. **Inicio:**
   - Conecta a WiFi
   - Conecta a MQTT
   - Inicializa ESP-NOW
   - Crea todas las tareas FreeRTOS

2. **Operación Normal:**
   - LED de vigía parpadea si alarma está armada
   - Recibe datos de sensores vía ESP-NOW
   - Publica estado cada 30 segundos
   - Publica heartbeat cada 60 segundos

3. **Alarma Disparada:**
   - Si alarma está armada y sensor se activa:
     - Publica evento de trigger por MQTT
     - Activa sirena (patrón intermitente)
     - LED de vigía sigue parpadeando

4. **Comandos Remotos:**
   - Recibe comandos por MQTT
   - Procesa: `arm` (activar/desactivar alarma)
   - Procesa: `siren` (activar/desactivar sirena)

## Solución de Problemas

### WiFi no conecta
- Verifica SSID y contraseña
- Verifica que el router esté en 2.4GHz (ESP32 no soporta 5GHz)
- Revisa Serial Monitor para mensajes de error

### MQTT no conecta
- Verifica IP del broker
- Verifica puerto (1883 por defecto)
- Verifica credenciales MQTT
- Verifica que el broker esté corriendo

### ESP-NOW no recibe datos
- Verifica MAC addresses de sensores
- Verifica que sensores estén en el mismo canal WiFi
- Verifica que sensores estén enviando datos
- Revisa RSSI en los mensajes recibidos

### Sirena no funciona
- Verifica conexión en GPIO 25
- Verifica que el relé/transistor esté correctamente conectado
- Verifica alimentación de la sirena (12V)

## Próximos Pasos

1. Crear firmware para sensores ESP-NOW
2. Implementar encriptación en ESP-NOW
3. Agregar más sensores
4. Implementar modo de prueba
5. Agregar buzzer para feedback local

## Licencia

Parte del proyecto FlowSight.
