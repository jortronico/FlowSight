/*
 * FlowSight - Central de Alarma (Versión HTTP)
 * Firmware para ESP32 con FreeRTOS, WiFi, HTTP y ESP-NOW
 * 
 * Compatible con Arduino IDE
 * 
 * Hardware:
 * - GPIO 27: Sirena principal
 * - GPIO 23: LED de vigía (indica alarma activa)
 * - GPIO 2: LED de estado WiFi (opcional)
 * - GPIO 4: Tamper switch (sabotaje)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <WiFiClientSecure.h>

// Suprimir warnings de deprecación de ArduinoJson
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wdeprecated-declarations"
#include <ArduinoJson.h>
#pragma GCC diagnostic pop

#include <esp_now.h>
#include <esp_wifi.h>
#include <freertos/FreeRTOS.h>
#include <freertos/task.h>
#include <freertos/queue.h>
#include <freertos/semphr.h>

// ============================================
// CONFIGURACIÓN DE PINES
// ============================================
#define PIN_SIREN 27          // GPIO 27 - Sirena principal
#define PIN_LED_VIGIA 23      // GPIO 23 - LED de vigía (indica alarma activa)
#define PIN_LED_STATUS 2      // GPIO 2 - LED de estado WiFi (opcional)
#define PIN_TAMPER 4          // GPIO 4 - Tamper switch (sabotaje)

// ============================================
// DEFINICIONES DE ESTADOS
// ============================================
#define ESTADO_TAMPER_OFF 0
#define ESTADO_TAMPER_ON 1

#define ESTADO_SIRENA_PRINCIPAL_OFF 0
#define ESTADO_SIRENA_PRINCIPAL_ON 1

#define APAGAR_SIRENA_PRINCIPAL 1
#define PRENDER_SIRENA_PRINCIPAL 0

// ============================================
// CONFIGURACIÓN WIFI Y HTTP
// ============================================
// ⚠️ IMPORTANTE: Configura estos valores según tu red

const char* WIFI_SSID = "Fibertel WiFi649 2.4GHz";
const char* WIFI_PASSWORD = "0042237126";
const char* API_BASE_URL = "https://puntopedido.com.ar";  // URL del backend
const char* API_KEY = "device_api_key_here";  // API Key para autenticación del dispositivo
const char* DEVICE_ID = "home_alarm_central_001";  // ID único de esta central

// URLs de los endpoints
const char* API_STATUS = "/api/home-alarm/device/status";
const char* API_HEARTBEAT = "/api/home-alarm/device/heartbeat";
const char* API_TRIGGER = "/api/home-alarm/device/trigger";
const char* API_SENSOR_DATA = "/api/home-alarm/device/sensor-data";
const char* API_COMMANDS = "/api/home-alarm/device/commands";

// Configuración HTTP
const int HTTP_TIMEOUT = 10000;  // 10 segundos
const int COMMAND_POLL_INTERVAL = 5000;  // Polling cada 5 segundos
const int HEARTBEAT_INTERVAL = 60000;  // Heartbeat cada 60 segundos
const int STATUS_UPDATE_INTERVAL = 30000;  // Actualizar estado cada 30 segundos

// ============================================
// ESTRUCTURAS DE DATOS
// ============================================
typedef struct {
  uint8_t mac[6];
  bool triggered;
  uint8_t sensor_id;  // 1 = escalera, 2 = sala entrada
  int rssi;
  unsigned long timestamp;
} SensorData;

typedef struct {
  char command[20];
  bool value;
  unsigned long timestamp;
} HTTPCommand;

// ============================================
// VARIABLES GLOBALES
// ============================================
WiFiClientSecure wifiClientSecure;
HTTPClient http;

// Estado del sistema
bool alarmArmed = false;
uint8_t sirenState = ESTADO_SIRENA_PRINCIPAL_OFF;
bool ledVigiaState = false;
uint8_t tamperState = ESTADO_TAMPER_OFF;
bool lastTamperState = true;  // true = cerrado (normal), false = abierto (tamper)
unsigned long lastHeartbeat = 0;
unsigned long lastStatusUpdate = 0;
unsigned long lastCommandPoll = 0;

// Colas FreeRTOS
QueueHandle_t sensorQueue;
QueueHandle_t httpCommandQueue;
SemaphoreHandle_t stateMutex;

// MAC addresses de los sensores (configurar según tus sensores)
uint8_t sensorEscaleraMAC[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x01};
uint8_t sensorSalaMAC[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x02};

// ============================================
// PROTOTIPOS DE FUNCIONES
// ============================================
void taskWiFiHTTP(void* parameter);
void taskESPNow(void* parameter);
void taskSirenControl(void* parameter);
void taskLEDControl(void* parameter);
void taskAlarmLogic(void* parameter);
void taskHeartbeat(void* parameter);
void taskTamperMonitor(void* parameter);
void taskCommandPoll(void* parameter);

void connectWiFi();
bool sendHTTPPost(const char* endpoint, JsonDocument& doc);
bool sendHTTPGet(const char* endpoint, JsonDocument& responseDoc);
void sendStatus();
void sendHeartbeat();
void sendSensorTrigger(uint8_t sensorId, bool triggered);
void sendTamperTrigger(bool triggered);
void processHTTPCommand(const char* command, bool value);
void pollCommands();

void setupESPNow();
void onESPNowRecv(const esp_now_recv_info* recv_info, const uint8_t* data, int len);
void onESPNowSent(const uint8_t* mac, esp_now_send_status_t status);

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n========================================");
  Serial.println("  FLOWSIGHT - Central de Alarma (HTTP)");
  Serial.println("  ESP32 + FreeRTOS + ESP-NOW + HTTP");
  Serial.println("========================================\n");

  // Configurar pines
  pinMode(PIN_SIREN, OUTPUT);
  pinMode(PIN_LED_VIGIA, OUTPUT);
  pinMode(PIN_LED_STATUS, OUTPUT);
  pinMode(PIN_TAMPER, INPUT_PULLUP);
  digitalWrite(PIN_SIREN, APAGAR_SIRENA_PRINCIPAL);
  digitalWrite(PIN_LED_VIGIA, LOW);
  digitalWrite(PIN_LED_STATUS, LOW);
  
  // Leer estado inicial del tamper
  lastTamperState = (digitalRead(PIN_TAMPER) == HIGH);

  // Crear colas y semáforos
  sensorQueue = xQueueCreate(10, sizeof(SensorData));
  httpCommandQueue = xQueueCreate(10, sizeof(HTTPCommand));
  stateMutex = xSemaphoreCreateMutex();

  if (!sensorQueue || !httpCommandQueue || !stateMutex) {
    Serial.println("❌ Error creando colas/semáforos");
    while(1) delay(1000);
  }

  // Configurar HTTPClient
  http.setTimeout(HTTP_TIMEOUT);
  http.setReuse(true);

  // Configurar WiFiClientSecure (para HTTPS)
  wifiClientSecure.setInsecure();  // Deshabilitar verificación de certificado (desarrollo)

  // Configurar ESP-NOW
  setupESPNow();

  // Crear tareas FreeRTOS
  xTaskCreatePinnedToCore(
    taskWiFiHTTP,
    "WiFiHTTP",
    8192,
    NULL,
    2,
    NULL,
    1  // Core 1
  );

  xTaskCreatePinnedToCore(
    taskESPNow,
    "ESPNow",
    4096,
    NULL,
    3,
    NULL,
    0  // Core 0
  );

  xTaskCreatePinnedToCore(
    taskSirenControl,
    "SirenCtrl",
    2048,
    NULL,
    2,
    NULL,
    1  // Core 1
  );

  xTaskCreatePinnedToCore(
    taskLEDControl,
    "LEDCtrl",
    2048,
    NULL,
    1,
    NULL,
    0  // Core 0
  );

  xTaskCreatePinnedToCore(
    taskAlarmLogic,
    "AlarmLogic",
    4096,
    NULL,
    3,
    NULL,
    1  // Core 1
  );

  xTaskCreatePinnedToCore(
    taskHeartbeat,
    "Heartbeat",
    2048,
    NULL,
    1,
    NULL,
    0  // Core 0
  );

  xTaskCreatePinnedToCore(
    taskTamperMonitor,
    "TamperMon",
    2048,
    NULL,
    4,
    NULL,
    0  // Core 0
  );

  xTaskCreatePinnedToCore(
    taskCommandPoll,
    "CmdPoll",
    4096,
    NULL,
    2,
    NULL,
    1  // Core 1
  );

  Serial.println("✅ Sistema iniciado - Tareas FreeRTOS creadas");
  Serial.println("📡 Esperando conexión WiFi...");
  
  // Verificar estado inicial del tamper
  if (!lastTamperState) {
    Serial.println("⚠️ TAMPER ACTIVO al iniciar!");
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
      tamperState = ESTADO_TAMPER_ON;
      sirenState = ESTADO_SIRENA_PRINCIPAL_ON;
      xSemaphoreGive(stateMutex);
    }
    sendTamperTrigger(true);
  }
}

// ============================================
// LOOP (no usado, todo en FreeRTOS)
// ============================================
void loop() {
  vTaskDelay(pdMS_TO_TICKS(10000));
}

// ============================================
// TAREA: WiFi y HTTP
// ============================================
void taskWiFiHTTP(void* parameter) {
  connectWiFi();
  
  // Esperar después de conectar WiFi
  vTaskDelay(pdMS_TO_TICKS(2000));
  
  // Enviar estado inicial
  sendStatus();

  while (true) {
    // Verificar conexión WiFi
    if (WiFi.status() != WL_CONNECTED) {
      Serial.println("⚠️ WiFi desconectado, reconectando...");
      connectWiFi();
      vTaskDelay(pdMS_TO_TICKS(5000));
    }

    // Enviar estado periódicamente
    unsigned long now = millis();
    if (now - lastStatusUpdate > STATUS_UPDATE_INTERVAL) {
      sendStatus();
      lastStatusUpdate = now;
    }

    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}

// ============================================
// TAREA: ESP-NOW (recibir datos de sensores)
// ============================================
void taskESPNow(void* parameter) {
  while (true) {
    SensorData sensorData;
    
    if (xQueueReceive(sensorQueue, &sensorData, pdMS_TO_TICKS(100)) == pdTRUE) {
      Serial.printf("📡 Sensor %d - Triggered: %s, RSSI: %d\n", 
                    sensorData.sensor_id, 
                    sensorData.triggered ? "SI" : "NO",
                    sensorData.rssi);

      // Enviar datos del sensor por HTTP
      StaticJsonDocument<200> doc;
      doc["device_id"] = DEVICE_ID;
      doc["sensor_id"] = sensorData.sensor_id;
      doc["sensor_name"] = (sensorData.sensor_id == 1) ? "escalera" : "sala_entrada";
      doc["triggered"] = sensorData.triggered;
      doc["rssi"] = sensorData.rssi;
      doc["timestamp"] = sensorData.timestamp;

      sendHTTPPost(API_SENSOR_DATA, doc);

      // Si la alarma está armada y el sensor se activó, disparar alarma
      if (alarmArmed && sensorData.triggered) {
        sendSensorTrigger(sensorData.sensor_id, true);
      }
    }

    vTaskDelay(pdMS_TO_TICKS(50));
  }
}

// ============================================
// TAREA: Control de Sirena
// ============================================
void taskSirenControl(void* parameter) {
  while (true) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
      if (sirenState == ESTADO_SIRENA_PRINCIPAL_ON) {
        digitalWrite(PIN_SIREN, PRENDER_SIRENA_PRINCIPAL);
        vTaskDelay(pdMS_TO_TICKS(500));
        digitalWrite(PIN_SIREN, APAGAR_SIRENA_PRINCIPAL);
        vTaskDelay(pdMS_TO_TICKS(500));
      } else {
        digitalWrite(PIN_SIREN, APAGAR_SIRENA_PRINCIPAL);
      }
      xSemaphoreGive(stateMutex);
    }
    vTaskDelay(pdMS_TO_TICKS(10));
  }
}

// ============================================
// TAREA: Control de LED de Vigía
// ============================================
void taskLEDControl(void* parameter) {
  while (true) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(100)) == pdTRUE) {
      if (alarmArmed || sirenState == ESTADO_SIRENA_PRINCIPAL_ON || tamperState == ESTADO_TAMPER_ON) {
        ledVigiaState = !ledVigiaState;
        digitalWrite(PIN_LED_VIGIA, ledVigiaState);
      } else {
        digitalWrite(PIN_LED_VIGIA, LOW);
        ledVigiaState = false;
      }
      xSemaphoreGive(stateMutex);
    }
    vTaskDelay(pdMS_TO_TICKS(1000));
  }
}

// ============================================
// TAREA: Lógica de Alarma
// ============================================
void taskAlarmLogic(void* parameter) {
  HTTPCommand cmd;
  
  while (true) {
    // Procesar comandos HTTP
    if (xQueueReceive(httpCommandQueue, &cmd, pdMS_TO_TICKS(100)) == pdTRUE) {
      processHTTPCommand(cmd.command, cmd.value);
    }

    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

// ============================================
// TAREA: Heartbeat
// ============================================
void taskHeartbeat(void* parameter) {
  while (true) {
    sendHeartbeat();
    vTaskDelay(pdMS_TO_TICKS(HEARTBEAT_INTERVAL));
  }
}

// ============================================
// TAREA: Monitoreo de Tamper
// ============================================
void taskTamperMonitor(void* parameter) {
  const TickType_t checkInterval = pdMS_TO_TICKS(100);
  
  while (true) {
    bool pinState = digitalRead(PIN_TAMPER);
    uint8_t currentTamperState = (pinState == HIGH) ? ESTADO_TAMPER_OFF : ESTADO_TAMPER_ON;
    
    if (currentTamperState != lastTamperState) {
      if (currentTamperState == ESTADO_TAMPER_ON) {
        Serial.println("🚨 TAMPER ACTIVADO!");
        
        if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
          tamperState = ESTADO_TAMPER_ON;
          sirenState = ESTADO_SIRENA_PRINCIPAL_ON;
          xSemaphoreGive(stateMutex);
        }
        
        sendTamperTrigger(true);
      } else {
        Serial.println("✅ Tamper restaurado");
        
        if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
          tamperState = ESTADO_TAMPER_OFF;
          xSemaphoreGive(stateMutex);
        }
        
        sendTamperTrigger(false);
      }
      
      lastTamperState = (currentTamperState == ESTADO_TAMPER_OFF);
      sendStatus();
    }
    
    vTaskDelay(checkInterval);
  }
}

// ============================================
// TAREA: Polling de Comandos
// ============================================
void taskCommandPoll(void* parameter) {
  while (true) {
    if (WiFi.status() == WL_CONNECTED) {
      pollCommands();
    }
    vTaskDelay(pdMS_TO_TICKS(COMMAND_POLL_INTERVAL));
  }
}

// ============================================
// FUNCIONES WiFi/HTTP
// ============================================
void connectWiFi() {
  Serial.print("📶 Conectando a WiFi: ");
  Serial.println(WIFI_SSID);

  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 30) {
    delay(500);
    Serial.print(".");
    attempts++;
    digitalWrite(PIN_LED_STATUS, !digitalRead(PIN_LED_STATUS));
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\n✅ WiFi conectado!");
    Serial.print("📡 IP: ");
    Serial.println(WiFi.localIP());
    digitalWrite(PIN_LED_STATUS, HIGH);
  } else {
    Serial.println("\n❌ Error conectando WiFi");
    digitalWrite(PIN_LED_STATUS, LOW);
  }
}

bool sendHTTPPost(const char* endpoint, JsonDocument& doc) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  String url = String(API_BASE_URL) + String(endpoint);
  
  http.begin(wifiClientSecure, url);
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-API-Key", API_KEY);
  http.addHeader("X-Device-ID", DEVICE_ID);

  String jsonString;
  serializeJson(doc, jsonString);

  int httpCode = http.POST(jsonString);

  bool success = (httpCode == 200 || httpCode == 201);
  
  if (success) {
    Serial.printf("✅ HTTP POST %s: %d\n", endpoint, httpCode);
  } else {
    Serial.printf("❌ HTTP POST %s: %d\n", endpoint, httpCode);
    if (httpCode > 0) {
      String response = http.getString();
      Serial.printf("   Respuesta: %s\n", response.c_str());
    }
  }

  http.end();
  return success;
}

bool sendHTTPGet(const char* endpoint, JsonDocument& responseDoc) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  String url = String(API_BASE_URL) + String(endpoint);
  
  http.begin(wifiClientSecure, url);
  http.addHeader("X-API-Key", API_KEY);
  http.addHeader("X-Device-ID", DEVICE_ID);

  int httpCode = http.GET();

  bool success = (httpCode == 200);
  
  if (success) {
    String response = http.getString();
    DeserializationError error = deserializeJson(responseDoc, response);
    
    if (error) {
      Serial.printf("❌ Error parseando JSON: %s\n", error.c_str());
      success = false;
    } else {
      Serial.printf("✅ HTTP GET %s: %d\n", endpoint, httpCode);
    }
  } else {
    Serial.printf("❌ HTTP GET %s: %d\n", endpoint, httpCode);
  }

  http.end();
  return success;
}

void sendStatus() {
  StaticJsonDocument<350> doc;
  doc["device_id"] = DEVICE_ID;
  doc["alarm_armed"] = alarmArmed;
  doc["siren_active"] = (sirenState == ESTADO_SIRENA_PRINCIPAL_ON);
  doc["siren_state"] = sirenState;
  doc["tamper_triggered"] = (tamperState == ESTADO_TAMPER_ON);
  doc["tamper_state"] = tamperState;
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;
  doc["free_heap"] = ESP.getFreeHeap();
  doc["timestamp"] = millis();

  sendHTTPPost(API_STATUS, doc);
}

void sendHeartbeat() {
  StaticJsonDocument<200> doc;
  doc["device_id"] = DEVICE_ID;
  doc["alarm_armed"] = alarmArmed;
  doc["siren_active"] = (sirenState == ESTADO_SIRENA_PRINCIPAL_ON);
  doc["siren_state"] = sirenState;
  doc["tamper_triggered"] = (tamperState == ESTADO_TAMPER_ON);
  doc["tamper_state"] = tamperState;
  doc["wifi_rssi"] = WiFi.RSSI();
  doc["uptime"] = millis() / 1000;
  doc["timestamp"] = millis();

  sendHTTPPost(API_HEARTBEAT, doc);
}

void sendSensorTrigger(uint8_t sensorId, bool triggered) {
  StaticJsonDocument<200> doc;
  doc["device_id"] = DEVICE_ID;
  doc["sensor_id"] = sensorId;
  doc["sensor_name"] = (sensorId == 1) ? "escalera" : "sala_entrada";
  doc["triggered"] = triggered;
  doc["alarm_armed"] = alarmArmed;
  doc["timestamp"] = millis();

  sendHTTPPost(API_TRIGGER, doc);

  // Activar sirena si está armada
  if (alarmArmed && triggered) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      sirenState = ESTADO_SIRENA_PRINCIPAL_ON;
      xSemaphoreGive(stateMutex);
    }
  }
}

void sendTamperTrigger(bool triggered) {
  StaticJsonDocument<250> doc;
  doc["device_id"] = DEVICE_ID;
  doc["event_type"] = triggered ? "tamper_activated" : "tamper_restored";
  doc["tamper_triggered"] = triggered;
  doc["tamper_state"] = triggered ? ESTADO_TAMPER_ON : ESTADO_TAMPER_OFF;
  doc["alarm_armed"] = alarmArmed;
  doc["message"] = triggered ? "Tamper switch activado - Sabotaje detectado" : "Tamper switch restaurado";
  doc["timestamp"] = millis();

  sendHTTPPost(API_TRIGGER, doc);
}

void pollCommands() {
  StaticJsonDocument<200> responseDoc;
  
  if (sendHTTPGet(API_COMMANDS, responseDoc)) {
    if (responseDoc["has_command"].is<bool>() && responseDoc["has_command"]) {
      HTTPCommand cmd;
      
      if (responseDoc["command"].is<const char*>()) {
        strncpy(cmd.command, responseDoc["command"], sizeof(cmd.command) - 1);
        cmd.command[sizeof(cmd.command) - 1] = '\0';
        
        if (responseDoc["value"].is<bool>()) {
          cmd.value = responseDoc["value"];
        } else {
          cmd.value = true;
        }
        
        cmd.timestamp = millis();
        
        if (xQueueSend(httpCommandQueue, &cmd, pdMS_TO_TICKS(100)) != pdTRUE) {
          Serial.println("⚠️ Cola de comandos llena");
        } else {
          Serial.printf("📥 Comando recibido: %s = %s\n", cmd.command, cmd.value ? "true" : "false");
        }
      }
    }
  }
}

void processHTTPCommand(const char* command, bool value) {
  Serial.printf("🔧 Procesando comando: %s = %s\n", command, value ? "true" : "false");

  if (strcmp(command, "arm") == 0) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      alarmArmed = value;
      xSemaphoreGive(stateMutex);
    }
    sendStatus();
  }
  else if (strcmp(command, "disarm") == 0) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      alarmArmed = false;
      if (sirenState == ESTADO_SIRENA_PRINCIPAL_ON) {
        sirenState = ESTADO_SIRENA_PRINCIPAL_OFF;
      }
      xSemaphoreGive(stateMutex);
    }
    sendStatus();
  }
  else if (strcmp(command, "siren") == 0) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      sirenState = value ? ESTADO_SIRENA_PRINCIPAL_ON : ESTADO_SIRENA_PRINCIPAL_OFF;
      xSemaphoreGive(stateMutex);
    }
    sendStatus();
  }
  else if (strcmp(command, "reset_tamper") == 0) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      tamperState = ESTADO_TAMPER_OFF;
      lastTamperState = true;  // Resetear estado
      xSemaphoreGive(stateMutex);
    }
    sendStatus();
  }
}

// ============================================
// FUNCIONES ESP-NOW
// ============================================
void setupESPNow() {
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Error inicializando ESP-NOW");
    return;
  }

  esp_now_register_recv_cb(onESPNowRecv);
  esp_now_register_send_cb(onESPNowSent);

  esp_now_peer_info_t peerInfo;
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  memcpy(peerInfo.peer_addr, sensorEscaleraMAC, 6);
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Error agregando peer escalera");
  } else {
    Serial.println("✅ Peer escalera agregado");
  }

  memcpy(peerInfo.peer_addr, sensorSalaMAC, 6);
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Error agregando peer sala");
  } else {
    Serial.println("✅ Peer sala agregado");
  }
}

void onESPNowRecv(const esp_now_recv_info* recv_info, const uint8_t* data, int len) {
  if (len != sizeof(SensorData) - 6) {
    return;
  }

  const uint8_t* mac = recv_info->src_addr;

  SensorData sensorData;
  memcpy(sensorData.mac, mac, 6);
  memcpy(&sensorData.triggered, data, sizeof(bool));
  memcpy(&sensorData.sensor_id, data + sizeof(bool), sizeof(uint8_t));
  memcpy(&sensorData.rssi, data + sizeof(bool) + sizeof(uint8_t), sizeof(int));
  sensorData.timestamp = millis();

  if (memcmp(mac, sensorEscaleraMAC, 6) == 0) {
    sensorData.sensor_id = 1;
  } else if (memcmp(mac, sensorSalaMAC, 6) == 0) {
    sensorData.sensor_id = 2;
  }

  if (xQueueSend(sensorQueue, &sensorData, 0) != pdTRUE) {
    Serial.println("⚠️ Cola de sensores llena");
  }
}

void onESPNowSent(const uint8_t* mac, esp_now_send_status_t status) {
  // Callback opcional
}
