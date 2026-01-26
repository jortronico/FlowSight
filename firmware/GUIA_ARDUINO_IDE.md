# Guía Completa - Ejecutar Firmware con Arduino IDE

Esta guía te explica cómo compilar y subir el firmware usando Arduino IDE en lugar de PlatformIO.

## 📋 Requisitos Previos

1. **Arduino IDE** (versión 1.8.19 o superior, o Arduino IDE 2.x)
2. **ESP32** conectado por USB
3. **Drivers USB** del ESP32 instalados (CH340 o CP2102)

## 🚀 Instalación y Configuración

### Paso 1: Instalar Arduino IDE

1. Descarga desde: https://www.arduino.cc/en/software
2. Instala el programa
3. Abre Arduino IDE

### Paso 2: Agregar Soporte para ESP32

1. En Arduino IDE, ve a **File → Preferences**
2. En "Additional Boards Manager URLs", agrega:
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
3. Click en **OK**

4. Ve a **Tools → Board → Boards Manager**
5. Busca "**esp32**" (por Espressif Systems)
6. Instala "**esp32 by Espressif Systems**" (versión 2.0.0 o superior)
7. Espera a que termine la instalación

### Paso 3: Instalar Librerías Necesarias

Ve a **Sketch → Include Library → Manage Libraries** e instala:

1. **PubSubClient** (por Nick O'Leary)
   - Busca "PubSubClient"
   - Instala la versión 2.8.0 o superior

2. **ArduinoJson** (por Benoit Blanchon)
   - Busca "ArduinoJson"
   - Instala la versión 6.21.0 o superior

3. **ESP-NOW** (ya incluida en ESP32, no necesita instalación)

## 📁 Preparar el Proyecto

### Opción A: Copiar Código Manualmente

1. Crea una nueva carpeta en tu escritorio: `home_alarm_central`
2. Abre Arduino IDE
3. **File → New** (crea un nuevo sketch)
4. **File → Save As** → Guarda como `home_alarm_central.ino` en la carpeta que creaste
5. Copia TODO el contenido de `firmware/home-alarm-central/src/main.cpp`
6. Pégalo en el sketch de Arduino IDE

### Opción B: Usar el Código Directamente

1. Abre `firmware/home-alarm-central/src/main.cpp` en un editor de texto
2. Copia todo el contenido
3. Pégalo en un nuevo sketch de Arduino IDE

## ⚙️ Configuración del Código

### Editar Credenciales

En el código, busca y modifica estas líneas (alrededor de la línea 22):

```cpp
// ============================================
// CONFIGURACIÓN WIFI Y MQTT
// ============================================
const char* WIFI_SSID = "TU_WIFI_SSID";           // ← Cambia esto
const char* WIFI_PASSWORD = "TU_WIFI_PASSWORD";   // ← Cambia esto
const char* MQTT_BROKER = "192.168.0.14";        // ← IP de tu servidor
const int MQTT_PORT = 1883;
const char* MQTT_USERNAME = "flowsight";
const char* MQTT_PASSWORD = "mqtt_password";
```

## 🔧 Configurar Arduino IDE para ESP32

### Seleccionar Placa

1. **Tools → Board → ESP32 Arduino**
2. Selecciona tu modelo de ESP32:
   - **ESP32 Dev Module** (más común)
   - O el modelo específico que tengas

### Configurar Puerto

1. Conecta el ESP32 por USB
2. **Tools → Port**
3. Selecciona el puerto COM (Windows) o /dev/ttyUSB* (Linux/Mac)
   - Windows: COM3, COM4, etc.
   - Linux: /dev/ttyUSB0
   - Mac: /dev/tty.usbserial-*

### Configuración Recomendada

En **Tools**, configura:

- **Board**: "ESP32 Dev Module"
- **Upload Speed**: "921600" (o "115200" si tienes problemas)
- **CPU Frequency**: "240MHz (WiFi/BT)"
- **Flash Frequency**: "80MHz"
- **Flash Mode**: "QIO"
- **Flash Size**: "4MB (32Mb)"
- **Partition Scheme**: "Default 4MB with spiffs"
- **Core Debug Level**: "Info" (o "None" para menos mensajes)
- **PSRAM**: "Disabled" (o "Enabled" si tu ESP32 tiene PSRAM)
- **Port**: Tu puerto COM

## 🚀 Compilar y Subir

### Paso 1: Verificar Código

1. Click en el botón **✓ (Verify)** o presiona **Ctrl+R**
2. Espera a que compile
3. Si hay errores, revísalos en la parte inferior

### Paso 2: Subir al ESP32

1. Asegúrate de que el ESP32 esté conectado
2. Click en el botón **→ (Upload)** o presiona **Ctrl+U**
3. Si aparece error, intenta:
   - Mantener presionado el botón **BOOT** del ESP32
   - Presionar **Upload** en Arduino IDE
   - Cuando aparezca "Connecting...", suelta el botón BOOT

### Paso 3: Ver Serial Monitor

1. Click en el ícono **🔍 (Serial Monitor)** o presiona **Ctrl+Shift+M**
2. Configura la velocidad en **115200 baud** (esquina inferior derecha)
3. Deberías ver:

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

## 📝 Estructura del Sketch

En Arduino IDE, el código debe estar así:

```cpp
// Todo el código en un solo archivo .ino
#include <Arduino.h>
#include <WiFi.h>
// ... resto del código
```

**Nota:** Arduino IDE automáticamente agrega `#include <Arduino.h>`, pero no pasa nada si está duplicado.

## 🔍 Solución de Problemas

### Error: "Board not found"

**Solución:**
1. Verifica que instalaste el soporte ESP32 correctamente
2. Reinicia Arduino IDE
3. Ve a **Tools → Board** y verifica que aparezca "ESP32 Arduino"

### Error: "Failed to connect to ESP32"

**Solución:**
1. Mantén presionado el botón **BOOT** del ESP32
2. Presiona el botón **RESET**
3. Suelta **RESET** pero mantén **BOOT**
4. Presiona **Upload** en Arduino IDE
5. Cuando veas "Connecting...", suelta **BOOT**

### Error: "Port not found"

**Solución:**
1. Verifica que el ESP32 esté conectado
2. Instala drivers USB (CH340 o CP2102)
3. En Windows: Abre Administrador de Dispositivos y verifica que aparezca el puerto COM
4. En **Tools → Port**, selecciona el puerto correcto

### Error: "WiFi.h: No such file or directory"

**Solución:**
1. Verifica que seleccionaste una placa ESP32 (no Arduino)
2. Ve a **Tools → Board** y selecciona "ESP32 Dev Module"

### Error: "PubSubClient.h: No such file or directory"

**Solución:**
1. Ve a **Sketch → Include Library → Manage Libraries**
2. Busca e instala "PubSubClient"
3. Reinicia Arduino IDE

### Error: "ArduinoJson.h: No such file or directory"

**Solución:**
1. Ve a **Sketch → Include Library → Manage Libraries**
2. Busca e instala "ArduinoJson"
3. Reinicia Arduino IDE

### Compilación muy lenta

**Solución:**
- Es normal la primera vez (descarga archivos)
- Las siguientes compilaciones serán más rápidas

### El código no compila

**Posibles causas:**
1. Librerías faltantes (instala PubSubClient y ArduinoJson)
2. Placa incorrecta seleccionada (debe ser ESP32)
3. Versión de Arduino IDE muy antigua (actualiza a 1.8.19+)

## 📊 Comparación: PlatformIO vs Arduino IDE

| Característica | PlatformIO | Arduino IDE |
|----------------|------------|-------------|
| Instalación | Más compleja | Más simple |
| Librerías | Automáticas | Manual |
| Estructura | Organizada | Un solo archivo |
| Debugging | Avanzado | Básico |
| Velocidad compilación | Rápida | Media |
| Recomendado para | Proyectos grandes | Principiantes |

## 🎯 Flujo de Trabajo con Arduino IDE

1. **Abrir Arduino IDE**
2. **File → New** (nuevo sketch)
3. **Pegar código** de `main.cpp`
4. **Configurar credenciales** (WiFi, MQTT)
5. **Tools → Board → ESP32 Dev Module**
6. **Tools → Port → Seleccionar puerto**
7. **✓ Verify** (compilar)
8. **→ Upload** (subir)
9. **🔍 Serial Monitor** (ver resultados)

## 📚 Recursos Adicionales

- [Arduino IDE Download](https://www.arduino.cc/en/software)
- [ESP32 Arduino Core](https://github.com/espressif/arduino-esp32)
- [Guía ESP32 con Arduino](https://randomnerdtutorials.com/installing-the-esp32-board-in-arduino-ide-windows-instructions/)

## ✅ Checklist

Antes de compilar, verifica:

- [ ] Arduino IDE instalado
- [ ] Soporte ESP32 agregado (Boards Manager)
- [ ] Librerías instaladas (PubSubClient, ArduinoJson)
- [ ] Placa ESP32 seleccionada en Tools
- [ ] Puerto COM seleccionado
- [ ] Credenciales WiFi configuradas
- [ ] IP del broker MQTT configurada
- [ ] ESP32 conectado por USB

## 🚀 Comandos Rápidos

- **Compilar**: `Ctrl+R` o botón ✓
- **Subir**: `Ctrl+U` o botón →
- **Serial Monitor**: `Ctrl+Shift+M` o botón 🔍
- **Nuevo Sketch**: `Ctrl+N`
- **Guardar**: `Ctrl+S`

¡Listo! Ahora puedes compilar y subir tu firmware con Arduino IDE. 🎉
