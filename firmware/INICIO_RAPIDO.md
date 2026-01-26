# 🚀 Inicio Rápido - PlatformIO

Guía rápida para compilar y subir el firmware en 5 minutos.

## ⚡ Pasos Rápidos

### 1. Instalar PlatformIO

**VS Code (Recomendado):**
- Abre VS Code
- Extensiones → Busca "PlatformIO IDE" → Instala
- Reinicia VS Code

### 2. Abrir Proyecto

```bash
# Navega a la carpeta del proyecto
cd firmware/home-alarm-central

# Si usas VS Code, simplemente abre la carpeta
# File → Open Folder → Selecciona home-alarm-central
```

### 3. Configurar (Solo Primera Vez)

Edita `src/main.cpp` y cambia estas líneas:

```cpp
// Línea ~15
const char* WIFI_SSID = "TU_WIFI_SSID";
const char* WIFI_PASSWORD = "TU_WIFI_PASSWORD";

// Línea ~18
const char* MQTT_BROKER = "192.168.0.14";  // Tu IP del servidor
```

### 4. Compilar y Subir

**En VS Code:**
1. Click en el ícono de PlatformIO (barra lateral izquierda)
2. En "PROJECT TASKS" → "esp32dev"
3. Click en "Build" (compilar)
4. Click en "Upload" (subir)
5. Click en "Monitor" (ver serial)

**En Terminal:**
```bash
# Compilar
pio run

# Subir (conecta el ESP32 primero)
pio run --target upload

# Ver serial
pio device monitor
```

## 📱 Comandos Útiles

```bash
# Ver dispositivos conectados
pio device list

# Limpiar proyecto
pio run --target clean

# Compilar con más información
pio run -v
```

## ✅ Verificar que Funciona

Después de subir, abre el monitor serial (`pio device monitor`) y deberías ver:

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
📥 Suscrito a: flowsight/home-alarm/central/command
✅ Sistema iniciado - Tareas FreeRTOS creadas
```

## 🐛 Problemas Comunes

### No encuentra el puerto
```bash
# Especifica el puerto manualmente
pio run --target upload --upload-port COM3
```

### Error al subir
1. Mantén presionado BOOT
2. Presiona RESET
3. Suelta BOOT
4. Intenta subir de nuevo

### WiFi no conecta
- Verifica SSID y password
- Verifica que el router esté en 2.4GHz

## 📖 Guía Completa

Para más detalles, ver: [GUIA_PLATFORMIO.md](GUIA_PLATFORMIO.md)
