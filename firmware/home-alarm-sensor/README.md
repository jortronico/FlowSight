# Firmware - Sensor de Presencia ESP-NOW

Firmware para ESP32 que implementa sensores de presencia que se comunican con la central vía ESP-NOW.

## Características

- ✅ **ESP32** con sensor PIR o similar
- ✅ **ESP-NOW** para comunicación sin WiFi
- ✅ Bajo consumo (puede usar deep sleep)
- ✅ Identificación por MAC address
- ✅ Envío de estado cuando detecta movimiento

## Hardware Requerido

- ESP32 (ESP32-C3, ESP32-S2, o ESP32 clásico)
- Sensor PIR (HC-SR501 o similar)
- LED indicador (opcional)
- Fuente de alimentación 3.3V o 5V

## Conexiones

```
ESP32          Componente
------         ----------
GPIO 4   --->  Sensor PIR OUT
GPIO 2   --->  LED indicador (+ resistencia 220Ω)
GND      --->  GND común
VIN/5V   --->  Alimentación del sensor
3.3V     --->  Alimentación del sensor (si es 3.3V)
```

## Configuración

### 1. Configurar MAC de la Central

En `src/main.cpp`, configura la MAC de tu central:

```cpp
uint8_t centralMAC[] = {0xAA, 0xBB, 0xCC, 0xDD, 0xEE, 0x00};
```

**Para obtener la MAC de la central:**
- Ejecuta el código de la central
- Revisa Serial Monitor al iniciar
- Copia la MAC que aparece

### 2. Configurar ID del Sensor

```cpp
#define SENSOR_ID 1  // 1 = escalera, 2 = sala entrada
```

### 3. Compilar y Subir

```bash
pio run --target upload
pio device monitor
```

## Funcionamiento

1. **Inicio:**
   - Inicializa ESP-NOW
   - Configura sensor PIR
   - Obtiene su propia MAC address
   - Muestra MAC en Serial Monitor

2. **Detección:**
   - Lee estado del sensor PIR
   - Si detecta movimiento:
     - Envía dato a central vía ESP-NOW
     - Enciende LED (opcional)
   - Espera delay para evitar múltiples triggers

3. **Comunicación:**
   - Envía estructura `SensorData` a la central
   - Incluye: sensor_id, triggered, rssi, timestamp

## Estructura de Datos

```cpp
struct SensorData {
  bool triggered;
  uint8_t sensor_id;
  int rssi;
  unsigned long timestamp;
};
```

## Optimización de Energía

Para sensores con batería, puedes usar deep sleep:

```cpp
// Después de enviar dato
esp_sleep_enable_timer_wakeup(10 * 1000000); // 10 segundos
esp_deep_sleep_start();
```

## Notas

- Los sensores NO necesitan WiFi
- ESP-NOW funciona sin conexión a router
- Rango típico: 100-200m en interiores
- Cada sensor debe tener un ID único (1, 2, 3...)
