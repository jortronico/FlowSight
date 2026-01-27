#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>
// NO usar HTTPClient - usar WiFiClientSecure directamente como en la prueba que funcionó

// Deshabilitar watchdog de tareas usando funciones de Arduino ESP32
// Los errores "task not found" son inofensivos si el watchdog está deshabilitado


// ================== WIFI / HTTP ==================
const char* WIFI_SSID      = "Fibertel WiFi649 2.4GHz";
const char* WIFI_PASS = "0042237126";

const char* API_BASE_URL  = "https://api-alarma.puntopedido.com.ar";
const char* API_KEY      = "6e665011-d462-4525-a735-a39a53161820";
const char* DEVICE_ID    = "home_alarm_central_001";

const char* API_STATUS   = "/api/home-alarm/device/status";
const char* API_HEART    = "/api/home-alarm/device/heartbeat";
const char* API_COMMANDS = "/api/home-alarm/device/commands";


// ================= PINES =================
#define PIN_SIREN   27
#define PIN_LED     23
#define PIN_TAMPER  4



// ================= ESTADO =================
bool alarmArmed   = false;
bool sirenState   = false;
bool tamperState  = false;

// ================= RTOS =================
SemaphoreHandle_t stateMutex;
QueueHandle_t httpQueue;

// ================= EVENTOS HTTP =================
enum HttpEventType {
  EVT_STATUS,
  EVT_HEARTBEAT
};

struct HttpEvent {
  HttpEventType type;
};

// ================= UTIL =================
void sendHttpEvent(HttpEventType type) {
  HttpEvent e{type};
  xQueueSend(httpQueue, &e, 0);
}

// ================= WIFI =================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("📡 Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi conectado");
}

// ================= TASK: HTTP =================
void taskHTTP(void* pv) {
  HttpEvent evt;
  unsigned long lastHttpTime = 0;
  const unsigned long HTTP_MIN_INTERVAL = 1000;  // Mínimo 1 segundo entre peticiones

  for (;;) {
    yield();  // Alimentar watchdog frecuentemente
    
    if (xQueueReceive(httpQueue, &evt, pdMS_TO_TICKS(2000))) {
      // Rate limiting: no hacer peticiones muy seguidas
      unsigned long now = millis();
      if (now - lastHttpTime < HTTP_MIN_INTERVAL) {
        vTaskDelay(pdMS_TO_TICKS(HTTP_MIN_INTERVAL - (now - lastHttpTime)));
      }
      lastHttpTime = millis();
      
      // Verificar WiFi antes de hacer petición
      if (WiFi.status() != WL_CONNECTED) {
        Serial.println("⚠️ WiFi desconectado, saltando HTTP");
        continue;
      }

      // Preparar JSON
      StaticJsonDocument<256> doc;
      String endpoint;
      String host;

      if (evt.type == EVT_STATUS) {
        if (xSemaphoreTake(stateMutex, pdMS_TO_TICKS(500)) == pdTRUE) {
          doc["device_id"] = DEVICE_ID;
          doc["armed"]    = alarmArmed;
          doc["siren"]    = sirenState;
          doc["tamper"]   = tamperState;
          xSemaphoreGive(stateMutex);
        } else {
          continue;
        }
        endpoint = API_STATUS;
      } else if (evt.type == EVT_HEARTBEAT) {
        doc["device_id"] = DEVICE_ID;
        doc["uptime"]   = millis() / 1000;
        endpoint = API_HEART;
      }

      // Extraer host de la URL
      host = "api-alarma.puntopedido.com.ar";
      
      yield();  // Alimentar watchdog antes de conectar
      
      // Crear cliente nuevo para cada petición (como en la prueba que funcionó)
      WiFiClientSecure client;
      client.setInsecure();
      client.setTimeout(3);  // Timeout más corto: 3 segundos
      
      Serial.printf("🔗 Conectando a %s...\n", host.c_str());
      yield();  // Alimentar antes de conectar
      
      unsigned long connectStart = millis();
      if (!client.connect(host.c_str(), 443)) {
        Serial.printf("❌ Conexión fallida (tiempo: %lu ms)\n", millis() - connectStart);
        client.stop();
        continue;
      }
      
      unsigned long connectTime = millis() - connectStart;
      Serial.printf("✅ Conectado en %lu ms\n", connectTime);
      
      Serial.println("✅ Conectado, enviando petición...");
      yield();  // Alimentar watchdog
      
      // Preparar body JSON
      String body;
      serializeJson(doc, body);
      
      // Enviar petición HTTP POST manualmente (como en la prueba que funcionó)
      client.print("POST ");
      client.print(endpoint);
      client.println(" HTTP/1.1");
      client.print("Host: ");
      client.println(host);
      client.println("Content-Type: application/json");
      client.print("X-API-Key: ");
      client.println(API_KEY);
      client.print("X-Device-ID: ");
      client.println(DEVICE_ID);
      client.print("Content-Length: ");
      client.println(body.length());
      client.println("Connection: close");
      client.println();
      client.print(body);
      
      yield();  // Alimentar watchdog después de enviar
      
      // Leer respuesta de forma simple (como en la prueba que funcionó)
      unsigned long timeout = millis() + 3000;  // Timeout más corto: 3 segundos
      bool headersReceived = false;
      int httpCode = 0;
      int lineCount = 0;
      
      // Leer solo los headers, ignorar el cuerpo
      while (client.connected() && millis() < timeout && lineCount < 20) {
        if (client.available()) {
          String line = client.readStringUntil('\n');
          lineCount++;
          
          // Leer código HTTP de la primera línea
          if (line.startsWith("HTTP/1.")) {
            int codeStart = line.indexOf(' ');
            if (codeStart > 0) {
              int codeEnd = line.indexOf(' ', codeStart + 1);
              if (codeEnd > 0) {
                httpCode = line.substring(codeStart + 1, codeEnd).toInt();
              }
            }
          }
          
          // Detectar fin de headers
          if (line == "\r" || line.length() == 0) {
            headersReceived = true;
            break;
          }
        }
        yield();  // Alimentar watchdog durante lectura
        vTaskDelay(pdMS_TO_TICKS(10));  // Pequeño delay para no saturar
      }
      
      // Cerrar conexión inmediatamente después de leer headers
      // No leer el cuerpo para evitar bloqueos
      client.stop();
      
      if (httpCode > 0) {
        Serial.printf("✅ HTTP %s: %d\n", (evt.type == EVT_HEARTBEAT) ? "HEARTBEAT" : "STATUS", httpCode);
      } else if (headersReceived) {
        Serial.println("✅ HTTP: Petición enviada (sin código)");
      } else {
        Serial.println("⚠️ HTTP: Timeout leyendo respuesta");
      }
      
      vTaskDelay(pdMS_TO_TICKS(200));  // Delay después de petición
    } else {
      vTaskDelay(pdMS_TO_TICKS(500));  // Delay más largo si no hay eventos
    }
  }
}

// ================= TASK: HEARTBEAT =================
void taskHeartbeat(void* pv) {
  // Watchdog deshabilitado, no necesitamos registrarnos
  // esp_task_wdt_add(NULL);

  for (;;) {
    if (WiFi.status() == WL_CONNECTED) {
      sendHttpEvent(EVT_HEARTBEAT);
    }
    
    // Delay de 60 segundos
    vTaskDelay(pdMS_TO_TICKS(60000));
  }
}

// ================= TASK: TAMPER =================
void taskTamper(void* pv) {
  // Watchdog deshabilitado, no necesitamos registrarnos
  // esp_task_wdt_add(NULL);

  bool last = false;

  for (;;) {
    bool now = digitalRead(PIN_TAMPER);

    if (now != last) {
      xSemaphoreTake(stateMutex, pdMS_TO_TICKS(1000));
      tamperState = now;
      xSemaphoreGive(stateMutex);

      sendHttpEvent(EVT_STATUS);
      last = now;
    }

    vTaskDelay(pdMS_TO_TICKS(200));
  }
}

// ================= SETUP =================
void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("  FLOWSIGHT - Central de Alarma (HTTP)");
  Serial.println("========================================\n");
  
  // Información del sistema
  Serial.printf("💾 Free heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("📦 Chip model: %s\n", ESP.getChipModel());
  Serial.printf("🔢 CPU frequency: %d MHz\n", ESP.getCpuFreqMHz());
  
  // Deshabilitar watchdog de tareas para evitar reinicios durante operaciones HTTP largas
  disableCore0WDT();
  disableCore1WDT();
  
  Serial.println("🔧 Watchdog de tareas deshabilitado\n");

  pinMode(PIN_SIREN, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_TAMPER, INPUT_PULLUP);

  digitalWrite(PIN_SIREN, HIGH);
  digitalWrite(PIN_LED, LOW);

  stateMutex = xSemaphoreCreateMutex();
  httpQueue  = xQueueCreate(10, sizeof(HttpEvent));

  connectWiFi();

  // Aumentar stacks para evitar overflow
  xTaskCreatePinnedToCore(taskHTTP,      "HTTP",      12288, NULL, 1, NULL, 1);  // Aumentado de 8192
  xTaskCreatePinnedToCore(taskHeartbeat, "Heartbeat", 4096, NULL, 1, NULL, 1);   // Aumentado de 2048
  xTaskCreatePinnedToCore(taskTamper,    "Tamper",    4096, NULL, 1, NULL, 1);   // Aumentado de 2048

  Serial.println("✅ Sistema iniciado (arquitectura estable)");
}

// ================= LOOP =================
void loop() {
  // NO hacer lógica pesada acá
  // El loop() puede estar registrado automáticamente en el watchdog
  // Por eso deshabilitamos el watchdog completamente en setup()
  delay(1000);  // Usar delay() en lugar de vTaskDelay() para evitar problemas con watchdog
}
