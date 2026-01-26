/*
 * FlowSight - Sensor de Presencia
 * Firmware para ESP32 con ESP-NOW
 * 
 * Compatible con Arduino IDE
 * 
 * Hardware:
 * - GPIO 4: Sensor PIR
 * - GPIO 2: LED indicador (opcional)
 */

#include <Arduino.h>
#include <esp_now.h>
#include <WiFi.h>

// ============================================
// CONFIGURACIÓN
// ============================================
#define PIN_PIR 4           // GPIO del sensor PIR
#define PIN_LED 2           // GPIO del LED indicador
#define SENSOR_ID 1         // 1 = escalera, 2 = sala entrada
#define DEBOUNCE_DELAY 2000 // Delay entre detecciones (ms)

// ⚠️ IMPORTANTE: Configura la MAC de tu central aquí
// Obtén la MAC de la central desde su Serial Monitor
uint8_t centralMAC[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x00};

// ============================================
// ESTRUCTURA DE DATOS
// ============================================
typedef struct {
  bool triggered;
  uint8_t sensor_id;
  int rssi;
  unsigned long timestamp;
} SensorData;

// ============================================
// VARIABLES GLOBALES
// ============================================
bool lastPIRState = false;
unsigned long lastTriggerTime = 0;

// ============================================
// CALLBACKS ESP-NOW
// ============================================
void onDataSent(const uint8_t* mac_addr, esp_now_send_status_t status) {
  if (status == ESP_NOW_SEND_SUCCESS) {
    Serial.println("✅ Dato enviado exitosamente");
  } else {
    Serial.println("❌ Error enviando dato");
  }
}

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  delay(1000);

  Serial.println("\n\n========================================");
  Serial.println("  FLOWSIGHT - Sensor de Presencia");
  Serial.printf("  Sensor ID: %d\n", SENSOR_ID);
  Serial.println("========================================\n");

  // Configurar pines
  pinMode(PIN_PIR, INPUT);
  pinMode(PIN_LED, OUTPUT);
  digitalWrite(PIN_LED, LOW);

  // Inicializar WiFi (necesario para ESP-NOW)
  WiFi.mode(WIFI_STA);
  
  // Mostrar MAC address de este sensor
  Serial.print("📡 MAC Address de este sensor: ");
  Serial.println(WiFi.macAddress());

  // Inicializar ESP-NOW
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Error inicializando ESP-NOW");
    return;
  }

  esp_now_register_send_cb(onDataSent);

  // Agregar peer (central)
  esp_now_peer_info_t peerInfo;
  memcpy(peerInfo.peer_addr, centralMAC, 6);
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Error agregando peer (central)");
    return;
  }

  Serial.println("✅ ESP-NOW inicializado");
  Serial.print("📡 Central MAC: ");
  for (int i = 0; i < 6; i++) {
    Serial.print(centralMAC[i], HEX);
    if (i < 5) Serial.print(":");
  }
  Serial.println();
  Serial.println("\n✅ Sensor listo - Esperando detecciones...\n");
}

// ============================================
// LOOP
// ============================================
void loop() {
  bool currentPIRState = digitalRead(PIN_PIR);
  unsigned long currentTime = millis();

  // Detectar cambio de estado (HIGH = movimiento detectado)
  if (currentPIRState == HIGH && lastPIRState == LOW) {
    // Verificar debounce
    if (currentTime - lastTriggerTime > DEBOUNCE_DELAY) {
      lastTriggerTime = currentTime;
      
      Serial.println("🚨 MOVIMIENTO DETECTADO!");
      
      // Preparar datos
      SensorData data;
      data.triggered = true;
      data.sensor_id = SENSOR_ID;
      data.rssi = WiFi.RSSI();
      data.timestamp = currentTime;

      // Enviar por ESP-NOW
      esp_err_t result = esp_now_send(centralMAC, (uint8_t*)&data, sizeof(data));

      if (result == ESP_OK) {
        Serial.println("📤 Dato enviado a central");
        digitalWrite(PIN_LED, HIGH);
        delay(100);
        digitalWrite(PIN_LED, LOW);
      } else {
        Serial.println("❌ Error enviando dato");
      }
    }
  }

  // Cuando el sensor vuelve a LOW, enviar estado "no triggered"
  if (currentPIRState == LOW && lastPIRState == HIGH) {
    SensorData data;
    data.triggered = false;
    data.sensor_id = SENSOR_ID;
    data.rssi = WiFi.RSSI();
    data.timestamp = millis();

    esp_now_send(centralMAC, (uint8_t*)&data, sizeof(data));
    Serial.println("✅ Movimiento terminado - Estado enviado");
  }

  lastPIRState = currentPIRState;
  delay(100); // Pequeño delay para evitar lectura excesiva
}
