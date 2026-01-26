# Guía Completa - Ejecutar Firmware con PlatformIO

Esta guía te explica paso a paso cómo compilar, subir y monitorear el firmware de la central de alarma usando PlatformIO.

## 📋 Requisitos Previos

1. **Visual Studio Code** (recomendado) o cualquier editor
2. **PlatformIO IDE** instalado
3. **ESP32** conectado por USB
4. **Drivers USB** del ESP32 instalados

## 🚀 Instalación de PlatformIO

### Opción 1: VS Code (Recomendado)

1. Abre Visual Studio Code
2. Ve a Extensiones (Ctrl+Shift+X)
3. Busca "PlatformIO IDE"
4. Instala la extensión
5. Reinicia VS Code

### Opción 2: CLI (Línea de comandos)

```bash
# Windows (PowerShell)
pip install platformio

# Verificar instalación
pio --version
```

## 📁 Estructura del Proyecto

```
firmware/
├── home-alarm-central/    # Proyecto de la central
│   ├── platformio.ini
│   └── src/
│       └── main.cpp
└── home-alarm-sensor/     # Proyecto de sensores
    ├── platformio.ini
    └── src/
        └── main.cpp
```

## 🔧 Configuración Inicial

### Paso 1: Abrir el Proyecto

**En VS Code:**
1. Abre VS Code
2. File → Open Folder
3. Navega a `firmware/home-alarm-central/`
4. PlatformIO se detectará automáticamente

**En CLI:**
```bash
cd firmware/home-alarm-central
```

### Paso 2: Configurar Credenciales

Edita `src/main.cpp` y configura:

```cpp
// Línea ~15-20
const char* WIFI_SSID = "TU_WIFI_SSID";
const char* WIFI_PASSWORD = "TU_WIFI_PASSWORD";
const char* MQTT_BROKER = "192.168.0.14";  // IP de tu servidor MQTT
```

### Paso 3: Verificar Puerto USB

**En Windows:**
1. Conecta el ESP32 por USB
2. Abre Administrador de Dispositivos
3. Busca "Puertos (COM y LPT)"
4. Anota el puerto COM (ej: COM3, COM4)

**En Linux/Mac:**
```bash
ls /dev/ttyUSB*    # Linux
ls /dev/tty.*      # Mac
```

## 🛠️ Comandos PlatformIO

### Compilar el Proyecto

**En VS Code:**
1. Click en el ícono de PlatformIO en la barra lateral
2. En "PROJECT TASKS" → "esp32dev"
3. Click en "Build"

**En CLI:**
```bash
pio run
```

### Subir al ESP32

**En VS Code:**
1. Conecta el ESP32 por USB
2. En "PROJECT TASKS" → "esp32dev"
3. Click en "Upload"

**En CLI:**
```bash
pio run --target upload
```

**Si tienes múltiples puertos:**
```bash
pio run --target upload --upload-port COM3
```

### Monitorear Serial

**En VS Code:**
1. En "PROJECT TASKS" → "esp32dev"
2. Click en "Monitor"

**En CLI:**
```bash
pio device monitor
```

**Con velocidad específica:**
```bash
pio device monitor --baud 115200
```

### Limpiar Proyecto

```bash
pio run --target clean
```

## 📝 Proceso Completo Paso a Paso

### Para la Central de Alarma

1. **Abrir proyecto:**
   ```bash
   cd firmware/home-alarm-central
   ```

2. **Configurar credenciales en `src/main.cpp`:**
   - WiFi SSID y password
   - IP del broker MQTT
   - Credenciales MQTT

3. **Compilar:**
   ```bash
   pio run
   ```
   Deberías ver: `✅ Success`

4. **Conectar ESP32 y subir:**
   ```bash
   pio run --target upload
   ```
   Deberías ver: `✅ Success. Uploading...`

5. **Abrir monitor serial:**
   ```bash
   pio device monitor
   ```
   Deberías ver:
   ```
   ========================================
     FLOWSIGHT - Central de Alarma
     ESP32 + FreeRTOS + ESP-NOW
   ========================================
   
   📶 Conectando a WiFi: TU_WIFI_SSID
   ✅ WiFi conectado!
   📡 IP: 192.168.0.100
   🔌 Conectando a MQTT...
   ✅ MQTT conectado!
   ```

### Para los Sensores

1. **Abrir proyecto:**
   ```bash
   cd firmware/home-alarm-sensor
   ```

2. **Configurar en `src/main.cpp`:**
   - MAC address de la central (obtener del Serial Monitor de la central)
   - SENSOR_ID (1 = escalera, 2 = sala entrada)

3. **Compilar y subir:**
   ```bash
   pio run --target upload
   ```

4. **Monitorear:**
   ```bash
   pio device monitor
   ```

## 🔍 Obtener MAC Addresses

### MAC de la Central

1. Sube el firmware a la central
2. Abre Serial Monitor
3. Busca la línea que muestra la MAC:
   ```
   📡 MAC Address: AA:BB:CC:DD:EE:FF
   ```
4. Copia esta MAC

### MAC de los Sensores

1. Sube el firmware a cada sensor
2. Abre Serial Monitor
3. Busca:
   ```
   📡 MAC Address de este sensor: AA:BB:CC:DD:EE:01
   ```
4. Copia esta MAC

### Configurar MACs en el Código

**En la central (`src/main.cpp`):**
```cpp
// Línea ~50-51
uint8_t sensorEscaleraMAC[] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0x01};
uint8_t sensorSalaMAC[] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0x02};
```

**En cada sensor (`src/main.cpp`):**
```cpp
// Línea ~10
uint8_t centralMAC[] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0x00};  // MAC de la central
```

## 🐛 Solución de Problemas

### Error: "No se encuentra el puerto COM"

**Solución:**
1. Verifica que el ESP32 esté conectado
2. Instala drivers CH340 o CP2102
3. Especifica el puerto manualmente:
   ```bash
   pio run --target upload --upload-port COM3
   ```

### Error: "Failed to connect to ESP32"

**Solución:**
1. Mantén presionado el botón BOOT del ESP32
2. Presiona y suelta el botón RESET
3. Suelta el botón BOOT
4. Intenta subir de nuevo

### Error: "WiFi no conecta"

**Solución:**
1. Verifica SSID y password
2. Verifica que el router esté en 2.4GHz (ESP32 no soporta 5GHz)
3. Revisa Serial Monitor para mensajes de error

### Error: "MQTT no conecta"

**Solución:**
1. Verifica IP del broker (debe ser accesible desde tu red)
2. Verifica que el broker esté corriendo
3. Verifica credenciales MQTT
4. Verifica firewall

### Error: "ESP-NOW no funciona"

**Solución:**
1. Verifica MAC addresses correctas
2. Verifica que ambos dispositivos estén encendidos
3. Verifica que estén en el mismo canal WiFi
4. Rango máximo: ~100-200m

## 📊 Comandos Útiles

### Ver información del dispositivo
```bash
pio device list
```

### Ver librerías instaladas
```bash
pio lib list
```

### Actualizar PlatformIO
```bash
pio upgrade
```

### Verificar configuración
```bash
pio run --target checkprog
```

### Compilar con más información
```bash
pio run -v
```

## 🎯 Flujo de Trabajo Recomendado

1. **Primera vez:**
   - Configura credenciales WiFi y MQTT
   - Compila: `pio run`
   - Sube: `pio run --target upload`
   - Monitorea: `pio device monitor`
   - Obtén MAC address de la central

2. **Configurar sensores:**
   - Configura MAC de la central en cada sensor
   - Configura SENSOR_ID único
   - Compila y sube cada sensor
   - Obtén MAC de cada sensor

3. **Configurar central con MACs de sensores:**
   - Edita MACs en `src/main.cpp` de la central
   - Recompila y sube

4. **Probar:**
   - Verifica conexión WiFi
   - Verifica conexión MQTT
   - Prueba detección de sensores
   - Prueba comandos desde la app móvil

## 📚 Recursos Adicionales

- [Documentación PlatformIO](https://docs.platformio.org/)
- [ESP32 con PlatformIO](https://docs.platformio.org/en/latest/platforms/espressif32.html)
- [Guía ESP-NOW](https://docs.espressif.com/projects/esp-idf/en/latest/esp32/api-reference/network/esp_now.html)

## ✅ Checklist

Antes de subir el firmware, verifica:

- [ ] Credenciales WiFi configuradas
- [ ] IP del broker MQTT correcta
- [ ] Credenciales MQTT correctas
- [ ] ESP32 conectado por USB
- [ ] Puerto COM detectado
- [ ] MAC addresses configuradas (si ya las tienes)
- [ ] Backend MQTT corriendo
- [ ] Router WiFi en 2.4GHz

¡Listo! Ahora puedes compilar y subir tu firmware. 🚀
