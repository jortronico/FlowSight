# Firmware FlowSight - Central y Sensores de Alarma

Este directorio contiene el firmware para la central de alarma y los sensores de presencia del sistema FlowSight.

## Estructura

```
firmware/
├── home-alarm-central/    # Firmware de la central (ESP32)
│   ├── src/
│   │   ├── main.cpp       # Código principal
│   │   └── config.h       # Configuración
│   ├── platformio.ini     # Configuración PlatformIO
│   └── README.md          # Documentación
│
└── home-alarm-sensor/     # Firmware de sensores (ESP32)
    ├── src/
    │   └── main.cpp       # Código del sensor
    ├── platformio.ini     # Configuración PlatformIO
    └── README.md          # Documentación
```

## Requisitos

- **PlatformIO** o **Arduino IDE** (ambos soportados)
- **ESP32** (cualquier variante)
- **Sensor PIR** (HC-SR501 o similar) para sensores
- **Sirena 12V** con relé/transistor para central
- **LEDs** para indicadores

## 🚀 Inicio Rápido

### Con PlatformIO
Ver: [GUIA_PLATFORMIO.md](GUIA_PLATFORMIO.md) o [INICIO_RAPIDO.md](INICIO_RAPIDO.md)

### Con Arduino IDE
Ver: [GUIA_ARDUINO_IDE.md](GUIA_ARDUINO_IDE.md)

**Archivos .ino listos para usar:**
- `home-alarm-central/home_alarm_central.ino` - Central
- `home-alarm-sensor/home_alarm_sensor.ino` - Sensor

## Instalación Rápida

### 1. Instalar PlatformIO

**Opción A: VS Code (Recomendado)**
1. Abre Visual Studio Code
2. Instala la extensión "PlatformIO IDE"
3. Reinicia VS Code

**Opción B: CLI**
```bash
pip install platformio
```

### 2. Configurar Central

1. Abrir `home-alarm-central/` en PlatformIO (VS Code o CLI)
2. Editar `src/main.cpp`:
   - Configurar WiFi SSID y password
   - Configurar IP del broker MQTT
   - Configurar MAC addresses de sensores (después de obtenerlas)
3. Compilar: `pio run`
4. Subir: `pio run --target upload`
5. Monitorear: `pio device monitor`

**📖 Ver guía completa:** [GUIA_PLATFORMIO.md](GUIA_PLATFORMIO.md)

### 3. Configurar Sensores

1. Abrir `home-alarm-sensor/` en PlatformIO
2. Editar `src/main.cpp`:
   - Configurar MAC de la central
   - Configurar SENSOR_ID (1 = escalera, 2 = sala)
3. Compilar y subir a cada sensor

## Flujo de Comunicación

```
[Sensor PIR] --ESP-NOW--> [Central ESP32] --WiFi/MQTT--> [Backend]
```

1. **Sensor detecta movimiento** → Envía por ESP-NOW a central
2. **Central recibe dato** → Publica por MQTT al backend
3. **Backend procesa** → Si alarma armada, activa sirena
4. **Comandos remotos** → Backend → MQTT → Central → Control local

## Topics MQTT

### Central Publica:
- `flowsight/home-alarm/central/status` - Estado
- `flowsight/home-alarm/central/heartbeat` - Heartbeat
- `flowsight/home-alarm/sensors/data` - Datos de sensores
- `flowsight/home-alarm/central/trigger` - Alarma disparada

### Central Suscribe:
- `flowsight/home-alarm/central/command` - Comandos

## Comandos MQTT

```json
{
  "command": "arm",
  "value": true
}
```

```json
{
  "command": "siren",
  "value": true
}
```

## Obtener MAC Addresses

### Central:
1. Subir firmware a central
2. Abrir Serial Monitor
3. Buscar línea: `📡 MAC Address: XX:XX:XX:XX:XX:XX`

### Sensores:
1. Subir firmware a sensor
2. Abrir Serial Monitor
3. Buscar línea: `📡 MAC Address de este sensor: XX:XX:XX:XX:XX:XX`

## Solución de Problemas

### ESP-NOW no funciona
- Verifica que central y sensores estén en el mismo canal WiFi
- Verifica MAC addresses correctas
- Verifica que ambos estén encendidos
- Rango máximo: ~100-200m en interiores

### MQTT no conecta
- Verifica IP del broker
- Verifica credenciales
- Verifica que broker esté corriendo
- Verifica firewall

### Sensor no detecta
- Verifica conexión del PIR
- Ajusta sensibilidad del PIR (potenciómetro)
- Verifica alimentación
- Revisa Serial Monitor para debug

## Próximas Mejoras

- [ ] Encriptación ESP-NOW
- [ ] Modo deep sleep para sensores
- [ ] Más tipos de sensores
- [ ] Configuración OTA
- [ ] Web server local para configuración

## Licencia

Parte del proyecto FlowSight.
