#ifndef CONFIG_H
#define CONFIG_H

// ============================================
// CONFIGURACIÓN DE RED
// ============================================
// IMPORTANTE: Configurar estos valores según tu red
#define WIFI_SSID "TU_WIFI_SSID"
#define WIFI_PASSWORD "TU_WIFI_PASSWORD"

// ============================================
// CONFIGURACIÓN MQTT
// ============================================
#define MQTT_BROKER "44.221.95.191"  // IP del servidor MQTT (AWS EC2 - api-alarma)
#define MQTT_PORT 1883
#define MQTT_USERNAME "flowsight"
#define MQTT_PASSWORD "mqtt_password"

// ============================================
// IDENTIFICACIÓN DEL DISPOSITIVO
// ============================================
#define DEVICE_ID "home_alarm_central_001"

// ============================================
// MAC ADDRESSES DE SENSORES ESP-NOW
// ============================================
// Configurar según las MAC de tus sensores
// Formato: {0xXX, 0xXX, 0xXX, 0xXX, 0xXX, 0xXX}
#define SENSOR_ESCALERA_MAC {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x01}
#define SENSOR_SALA_MAC {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x02}

// ============================================
// CONFIGURACIÓN DE PINES
// ============================================
#define PIN_SIREN 25
#define PIN_LED_VIGIA 26
#define PIN_LED_STATUS 2

// ============================================
// TIMING
// ============================================
#define HEARTBEAT_INTERVAL 60000      // 60 segundos
#define STATUS_PUBLISH_INTERVAL 30000 // 30 segundos
#define LED_BLINK_INTERVAL 1000       // 1 segundo
#define SIREN_PATTERN_ON 500          // 500ms encendido
#define SIREN_PATTERN_OFF 500         // 500ms apagado

#endif
