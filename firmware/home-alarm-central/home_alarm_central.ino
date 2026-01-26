/*
 * FlowSight - Central de Alarma
 * Firmware para ESP32 con FreeRTOS, WiFi, MQTT y ESP-NOW
 * 
 * Compatible con Arduino IDE
 * 
 * Hardware:
 * - GPIO 25: Sirena principal
 * - GPIO 26: LED de vigía (indica alarma activa)
 * - GPIO 2: LED de estado WiFi (opcional)
 */

#include <Arduino.h>
#include <WiFi.h>
#include <PubSubClient.h>
#include <ArduinoJson.h>
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
// CONFIGURACIÓN WIFI Y MQTT
// ============================================
// ⚠️ IMPORTANTE: Configura estos valores según tu red
const char* WIFI_SSID = "TU_WIFI_SSID";
const char* WIFI_PASSWORD = "TU_WIFI_PASSWORD";
const char* MQTT_BROKER = "192.168.0.14";  // IP del broker MQTT
const int MQTT_PORT = 1883;
const char* MQTT_USERNAME = "flowsight";
const char* MQTT_PASSWORD = "mqtt_password";
const char* DEVICE_ID = "home_alarm_central_001";  // ID único de esta central

// ============================================
// TOPICS MQTT
// ============================================
const char* TOPIC_STATUS = "flowsight/home-alarm/central/status";
const char* TOPIC_COMMAND = "flowsight/home-alarm/central/command";
const char* TOPIC_SENSOR_DATA = "flowsight/home-alarm/sensors/data";
const char* TOPIC_ALARM_TRIGGER = "flowsight/home-alarm/central/trigger";
const char* TOPIC_HEARTBEAT = "flowsight/home-alarm/central/heartbeat";

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
} MQTTCommand;

// ============================================
// VARIABLES GLOBALES
// ============================================
WiFiClient wifiClient;
PubSubClient mqttClient(wifiClient);

// Estado del sistema
bool alarmArmed = false;
uint8_t sirenState = ESTADO_SIRENA_PRINCIPAL_OFF;
bool ledVigiaState = false;
uint8_t tamperState = ESTADO_TAMPER_OFF;
uint8_t lastTamperState = ESTADO_TAMPER_OFF;  // Estado anterior del tamper
unsigned long lastHeartbeat = 0;
unsigned long lastSensorCheck = 0;

// Colas FreeRTOS
QueueHandle_t sensorQueue;
QueueHandle_t mqttCommandQueue;
SemaphoreHandle_t stateMutex;

// MAC addresses de los sensores (configurar según tus sensores)
// ⚠️ IMPORTANTE: Obtén las MAC de tus sensores y configura aquí
uint8_t sensorEscaleraMAC[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x01};
uint8_t sensorSalaMAC[] = {0xFF, 0xFF, 0xFF, 0xFF, 0xFF, 0x02};

// ============================================
// PROTOTIPOS DE FUNCIONES
// ============================================
void taskWiFiMQTT(void* parameter);
void taskESPNow(void* parameter);
void taskSirenControl(void* parameter);
void taskLEDControl(void* parameter);
void taskAlarmLogic(void* parameter);
void taskHeartbeat(void* parameter);
void taskTamperMonitor(void* parameter);

void connectWiFi();
void connectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void publishStatus();
void publishSensorTrigger(uint8_t sensorId, bool triggered);
void publishTamperTrigger(bool triggered);
void processMQTTCommand(const char* command, bool value);

void setupESPNow();
void onESPNowRecv(const uint8_t* mac, const uint8_t* data, int len);
void onESPNowSent(const uint8_t* mac, esp_now_send_status_t status);

// ============================================
// SETUP
// ============================================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n\n========================================");
  Serial.println("  FLOWSIGHT - Central de Alarma");
  Serial.println("  ESP32 + FreeRTOS + ESP-NOW");
  Serial.println("========================================\n");

  // Configurar pines
  pinMode(PIN_SIREN, OUTPUT);
  pinMode(PIN_LED_VIGIA, OUTPUT);
  pinMode(PIN_LED_STATUS, OUTPUT);
  pinMode(PIN_TAMPER, INPUT_PULLUP);  // Tamper con pull-up interno
  digitalWrite(PIN_SIREN, APAGAR_SIRENA_PRINCIPAL);  // Inicializar sirena apagada
  digitalWrite(PIN_LED_VIGIA, LOW);
  digitalWrite(PIN_LED_STATUS, LOW);
  
  // Leer estado inicial del tamper
  // Con INPUT_PULLUP: HIGH = switch cerrado (normal), LOW = switch abierto (tamper)
  lastTamperState = (digitalRead(PIN_TAMPER) == HIGH) ? ESTADO_TAMPER_OFF : ESTADO_TAMPER_ON;

  // Crear colas y semáforos
  sensorQueue = xQueueCreate(10, sizeof(SensorData));
  mqttCommandQueue = xQueueCreate(10, sizeof(MQTTCommand));
  stateMutex = xSemaphoreCreateMutex();

  if (!sensorQueue || !mqttCommandQueue || !stateMutex) {
    Serial.println("❌ Error creando colas/semáforos");
    while(1) delay(1000);
  }

  // Configurar ESP-NOW
  setupESPNow();

  // Crear tareas FreeRTOS
  xTaskCreatePinnedToCore(
    taskWiFiMQTT,
    "WiFiMQTT",
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
    4,  // Alta prioridad
    NULL,
    0  // Core 0
  );

  Serial.println("✅ Sistema iniciado - Tareas FreeRTOS creadas");
  Serial.println("📡 Esperando conexión WiFi...");
  
  // Verificar estado inicial del tamper
  if (lastTamperState == ESTADO_TAMPER_ON) {
    Serial.println("⚠️ TAMPER ACTIVO al iniciar!");
    tamperState = ESTADO_TAMPER_ON;
    sirenState = ESTADO_SIRENA_PRINCIPAL_ON;
    digitalWrite(PIN_SIREN, PRENDER_SIRENA_PRINCIPAL);
    publishTamperTrigger(true);
  }
}

// ============================================
// LOOP (no usado, todo en FreeRTOS)
// ============================================
void loop() {
  vTaskDelay(pdMS_TO_TICKS(10000));  // Delay largo, no se usa
}

// ============================================
// TAREA: WiFi y MQTT
// ============================================
void taskWiFiMQTT(void* parameter) {
  connectWiFi();
  mqttClient.setServer(MQTT_BROKER, MQTT_PORT);
  mqttClient.setCallback(mqttCallback);
  connectMQTT();

  TickType_t lastReconnect = 0;
  const TickType_t reconnectInterval = pdMS_TO_TICKS(5000);

  while (true) {
    if (!mqttClient.connected()) {
      TickType_t now = xTaskGetTickCount();
      if (now - lastReconnect > reconnectInterval) {
        lastReconnect = now;
        connectMQTT();
      }
    } else {
      mqttClient.loop();
    }

    // Publicar estado periódicamente
    static unsigned long lastStatus = 0;
    if (millis() - lastStatus > 30000) {  // Cada 30 segundos
      publishStatus();
      lastStatus = millis();
    }

    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

// ============================================
// TAREA: ESP-NOW (recibir datos de sensores)
// ============================================
void taskESPNow(void* parameter) {
  while (true) {
    SensorData sensorData;
    
    if (xQueueReceive(sensorQueue, &sensorData, pdMS_TO_TICKS(100)) == pdTRUE) {
      // Procesar datos del sensor
      Serial.printf("📡 Sensor %d - Triggered: %s, RSSI: %d\n", 
                    sensorData.sensor_id, 
                    sensorData.triggered ? "SI" : "NO",
                    sensorData.rssi);

      // Publicar por MQTT
      if (mqttClient.connected()) {
        StaticJsonDocument<200> doc;
        doc["sensor_id"] = sensorData.sensor_id;
        doc["sensor_name"] = (sensorData.sensor_id == 1) ? "escalera" : "sala_entrada";
        doc["triggered"] = sensorData.triggered;
        doc["rssi"] = sensorData.rssi;
        doc["timestamp"] = sensorData.timestamp;
        doc["device_id"] = DEVICE_ID;

        char buffer[200];
        serializeJson(doc, buffer);
        mqttClient.publish(TOPIC_SENSOR_DATA, buffer);

        // Si la alarma está armada y el sensor se activó, disparar alarma
        if (alarmArmed && sensorData.triggered) {
          publishSensorTrigger(sensorData.sensor_id, true);
        }
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
        // Sirena activa: patrón intermitente
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
      if (alarmArmed) {
        // LED parpadea cuando alarma está armada
        ledVigiaState = !ledVigiaState;
        digitalWrite(PIN_LED_VIGIA, ledVigiaState);
      } else {
        digitalWrite(PIN_LED_VIGIA, LOW);
        ledVigiaState = false;
      }
      xSemaphoreGive(stateMutex);
    }
    vTaskDelay(pdMS_TO_TICKS(1000));  // Parpadeo cada 1 segundo
  }
}

// ============================================
// TAREA: Lógica de Alarma
// ============================================
void taskAlarmLogic(void* parameter) {
  MQTTCommand cmd;
  
  while (true) {
    // Procesar comandos MQTT
    if (xQueueReceive(mqttCommandQueue, &cmd, pdMS_TO_TICKS(100)) == pdTRUE) {
      processMQTTCommand(cmd.command, cmd.value);
    }

    // Verificar sensores si la alarma está armada
    if (alarmArmed) {
      // La lógica de detección se maneja en taskESPNow
      // Aquí solo verificamos estado general
    }

    vTaskDelay(pdMS_TO_TICKS(100));
  }
}

// ============================================
// TAREA: Heartbeat
// ============================================
void taskHeartbeat(void* parameter) {
  while (true) {
    if (mqttClient.connected()) {
      StaticJsonDocument<150> doc;
      doc["device_id"] = DEVICE_ID;
      doc["alarm_armed"] = alarmArmed;
      doc["siren_active"] = (sirenState == ESTADO_SIRENA_PRINCIPAL_ON);
      doc["siren_state"] = sirenState;
      doc["tamper_triggered"] = (tamperState == ESTADO_TAMPER_ON);
      doc["tamper_state"] = tamperState;
      doc["wifi_rssi"] = WiFi.RSSI();
      doc["uptime"] = millis() / 1000;
      doc["timestamp"] = millis();

      char buffer[150];
      serializeJson(doc, buffer);
      mqttClient.publish(TOPIC_HEARTBEAT, buffer);
    }

    vTaskDelay(pdMS_TO_TICKS(60000));  // Cada 60 segundos
  }
}

// ============================================
// TAREA: Monitoreo de Tamper
// ============================================
void taskTamperMonitor(void* parameter) {
  const TickType_t checkInterval = pdMS_TO_TICKS(100);  // Verificar cada 100ms
  
  while (true) {
    // Leer estado del tamper
    // Con INPUT_PULLUP: HIGH = switch cerrado (normal), LOW = switch abierto (tamper)
    bool pinState = digitalRead(PIN_TAMPER);
    uint8_t currentTamperState = (pinState == HIGH) ? ESTADO_TAMPER_OFF : ESTADO_TAMPER_ON;
    
    // Detectar cambio de estado
    if (currentTamperState != lastTamperState) {
      // Cambio detectado
      if (currentTamperState == ESTADO_TAMPER_ON) {
        // Tamper activado (switch abierto)
        Serial.println("🚨 TAMPER ACTIVADO! - Switch de sabotaje detectado");
        
        if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
          tamperState = ESTADO_TAMPER_ON;
          sirenState = ESTADO_SIRENA_PRINCIPAL_ON;  // Activar sirena inmediatamente
          xSemaphoreGive(stateMutex);
        }
        
        // Publicar evento por MQTT
        publishTamperTrigger(true);
        
      } else {
        // Tamper restaurado (switch cerrado de nuevo)
        Serial.println("✅ Tamper restaurado");
        
        if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
          tamperState = ESTADO_TAMPER_OFF;
          // No desactivar sirena automáticamente, debe hacerse manualmente
          xSemaphoreGive(stateMutex);
        }
        
        // Publicar evento de restauración
        publishTamperTrigger(false);
      }
      
      lastTamperState = currentTamperState;
      
      // Publicar estado actualizado
      publishStatus();
    }
    
    vTaskDelay(checkInterval);
  }
}

// ============================================
// FUNCIONES WiFi/MQTT
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

void connectMQTT() {
  if (mqttClient.connected()) return;

  Serial.print("🔌 Conectando a MQTT...");
  
  String clientId = "home_alarm_central_";
  clientId += String(random(0xffff), HEX);

  if (mqttClient.connect(clientId.c_str(), MQTT_USERNAME, MQTT_PASSWORD)) {
    Serial.println(" ✅ MQTT conectado!");
    mqttClient.subscribe(TOPIC_COMMAND);
    Serial.print("📥 Suscrito a: ");
    Serial.println(TOPIC_COMMAND);
    
    // Publicar estado inicial
    publishStatus();
  } else {
    Serial.print(" ❌ Error: ");
    Serial.println(mqttClient.state());
  }
}

void mqttCallback(char* topic, byte* payload, unsigned int length) {
  payload[length] = '\0';
  String message = String((char*)payload);

  Serial.print("📨 MQTT recibido [");
  Serial.print(topic);
  Serial.print("]: ");
  Serial.println(message);

  StaticJsonDocument<200> doc;
  DeserializationError error = deserializeJson(doc, message);

  if (error) {
    Serial.print("❌ Error parseando JSON: ");
    Serial.println(error.c_str());
    return;
  }

  // Procesar comandos
  if (strcmp(topic, TOPIC_COMMAND) == 0) {
    MQTTCommand cmd;
    
    if (doc.containsKey("command")) {
      strncpy(cmd.command, doc["command"], sizeof(cmd.command) - 1);
      cmd.command[sizeof(cmd.command) - 1] = '\0';
      
      if (doc.containsKey("value")) {
        cmd.value = doc["value"];
      } else {
        cmd.value = true;
      }
      
      cmd.timestamp = millis();
      
      if (xQueueSend(mqttCommandQueue, &cmd, pdMS_TO_TICKS(100)) != pdTRUE) {
        Serial.println("⚠️ Cola de comandos llena");
      }
    }
  }
}

void publishStatus() {
  if (!mqttClient.connected()) return;

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

  char buffer[350];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_STATUS, buffer);
}

void publishSensorTrigger(uint8_t sensorId, bool triggered) {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<200> doc;
  doc["device_id"] = DEVICE_ID;
  doc["sensor_id"] = sensorId;
  doc["sensor_name"] = (sensorId == 1) ? "escalera" : "sala_entrada";
  doc["triggered"] = triggered;
  doc["alarm_armed"] = alarmArmed;
  doc["timestamp"] = millis();

  char buffer[200];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_ALARM_TRIGGER, buffer);

  // Activar sirena si está armada
  if (alarmArmed && triggered) {
    if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
      sirenState = ESTADO_SIRENA_PRINCIPAL_ON;
      xSemaphoreGive(stateMutex);
    }
  }
}

void publishTamperTrigger(bool triggered) {
  if (!mqttClient.connected()) return;

  StaticJsonDocument<250> doc;
  doc["device_id"] = DEVICE_ID;
  doc["event_type"] = triggered ? "tamper_activated" : "tamper_restored";
  doc["tamper_triggered"] = triggered;
  doc["tamper_state"] = triggered ? ESTADO_TAMPER_ON : ESTADO_TAMPER_OFF;
  doc["alarm_armed"] = alarmArmed;
  doc["message"] = triggered ? "Tamper switch activado - Sabotaje detectado" : "Tamper switch restaurado";
  doc["timestamp"] = millis();

  char buffer[250];
  serializeJson(doc, buffer);
  mqttClient.publish(TOPIC_ALARM_TRIGGER, buffer);
  
  Serial.printf("📤 Evento tamper publicado: %s\n", triggered ? "ACTIVADO" : "RESTAURADO");
}

void processMQTTCommand(const char* command, bool value) {
  Serial.printf("⚙️ Procesando comando: %s = %s\n", command, value ? "true" : "false");

  if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000)) == pdTRUE) {
    if (strcmp(command, "arm") == 0) {
      alarmArmed = value;
      Serial.println(value ? "🔒 Alarma ARMADA" : "🔓 Alarma DESARMADA");
    } else if (strcmp(command, "siren") == 0) {
      sirenState = value ? ESTADO_SIRENA_PRINCIPAL_ON : ESTADO_SIRENA_PRINCIPAL_OFF;
      Serial.println(value ? "🚨 Sirena ACTIVADA" : "🔇 Sirena DESACTIVADA");
    } else if (strcmp(command, "reset_tamper") == 0) {
      // Comando para resetear estado de tamper (después de verificación)
      tamperState = ESTADO_TAMPER_OFF;
      Serial.println("✅ Estado tamper reseteado");
    }
    xSemaphoreGive(stateMutex);
    
    publishStatus();
  }
}

// ============================================
// FUNCIONES ESP-NOW
// ============================================
void setupESPNow() {
  WiFi.mode(WIFI_STA);
  
  if (esp_now_init() != ESP_OK) {
    Serial.println("❌ Error inicializando ESP-NOW");
    return;
  }

  esp_now_register_recv_cb(onESPNowRecv);
  esp_now_register_send_cb(onESPNowSent);

  // Agregar peers (sensores)
  esp_now_peer_info_t peerInfo;
  peerInfo.channel = 0;
  peerInfo.encrypt = false;

  // Sensor escalera
  memcpy(peerInfo.peer_addr, sensorEscaleraMAC, 6);
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Error agregando peer escalera");
  } else {
    Serial.println("✅ Peer escalera agregado");
  }

  // Sensor sala entrada
  memcpy(peerInfo.peer_addr, sensorSalaMAC, 6);
  if (esp_now_add_peer(&peerInfo) != ESP_OK) {
    Serial.println("❌ Error agregando peer sala");
  } else {
    Serial.println("✅ Peer sala agregado");
  }

  Serial.println("✅ ESP-NOW inicializado");
}

void onESPNowRecv(const uint8_t* mac, const uint8_t* data, int len) {
  if (len != sizeof(SensorData) - 6) {  // -6 porque no enviamos MAC en el payload
    return;
  }

  SensorData sensorData;
  memcpy(sensorData.mac, mac, 6);
  memcpy(&sensorData.triggered, data, sizeof(bool));
  memcpy(&sensorData.sensor_id, data + sizeof(bool), sizeof(uint8_t));
  memcpy(&sensorData.rssi, data + sizeof(bool) + sizeof(uint8_t), sizeof(int));
  sensorData.timestamp = millis();

  // Identificar sensor por MAC
  if (memcmp(mac, sensorEscaleraMAC, 6) == 0) {
    sensorData.sensor_id = 1;
  } else if (memcmp(mac, sensorSalaMAC, 6) == 0) {
    sensorData.sensor_id = 2;
  }

  // Enviar a cola
  if (xQueueSend(sensorQueue, &sensorData, 0) != pdTRUE) {
    Serial.println("⚠️ Cola de sensores llena");
  }
}

void onESPNowSent(const uint8_t* mac, esp_now_send_status_t status) {
  // Callback opcional para confirmación de envío
}
