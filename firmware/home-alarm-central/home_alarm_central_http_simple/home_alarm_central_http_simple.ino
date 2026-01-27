/*
 * FlowSight - Central de Alarma (Versión Simple sin FreeRTOS)
 * Basado en el código de prueba que funcionó
 * Sin FreeRTOS para evitar problemas de watchdog
 */

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <ArduinoJson.h>

// ================== WIFI / HTTP ==================
const char* WIFI_SSID = "Fibertel WiFi649 2.4GHz";
const char* WIFI_PASS = "0042237126";

// Opción 1: Usar el dominio con proxy (HTTPS puerto 443)
const char* API_BASE_URL = "https://api-alarma.puntopedido.com.ar";
// Opción 2: Si el proxy falla, probar conectarse directamente al backend (cambiar a IP y puerto)
// const char* API_BASE_URL = "http://TU_IP_SERVIDOR:3001";  // Descomentar y poner tu IP

const char* API_KEY = "6e665011-d462-4525-a735-a39a53161820";
const char* DEVICE_ID = "home_alarm_central_001";

const char* API_STATUS = "/api/home-alarm/device/status";
const char* API_HEART = "/api/home-alarm/device/heartbeat";
const char* API_COMMANDS = "/api/home-alarm/device/commands";

// ================= PINES =================
#define PIN_SIREN   27
#define PIN_LED     23
#define PIN_TAMPER  4
#define PIN_SENSOR_ESCALERA  34  // Sensor de movimiento - nivel bajo = movimiento detectado

// ================= ESTADO =================
bool alarmArmed = false;
bool sirenState = false;
bool tamperState = false;
bool lastTamperState = true;
bool sensorEscaleraTriggered = false;
bool lastSensorEscaleraState = true;  // true = sin movimiento, false = movimiento

// ================= TIMING =================
unsigned long lastHeartbeat = 0;
unsigned long lastStatusUpdate = 0;
unsigned long lastTamperCheck = 0;
unsigned long lastCommandPoll = 0;
unsigned long lastSensorCheck = 0;
const unsigned long HEARTBEAT_INTERVAL = 60000;  // 60 segundos
const unsigned long STATUS_INTERVAL = 30000;     // 30 segundos
const unsigned long TAMPER_CHECK_INTERVAL = 200; // 200ms
const unsigned long COMMAND_POLL_INTERVAL = 5000; // 5 segundos - polling de comandos
const unsigned long SENSOR_CHECK_INTERVAL = 100; // 100ms - verificar sensor frecuentemente

// ================= FUNCIONES =================
void connectWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASS);

  Serial.print("📡 Conectando WiFi");
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("\n✅ WiFi conectado");
  Serial.print("📡 IP: ");
  Serial.println(WiFi.localIP());
}

bool sendHTTPPost(const char* endpoint, JsonDocument& doc) {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  // Determinar si usar HTTPS o HTTP basado en la URL
  bool useHTTPS = (String(API_BASE_URL).startsWith("https://"));
  String host;
  int port;
  
  if (useHTTPS) {
    host = "api-alarma.puntopedido.com.ar";
    port = 443;
  } else {
    // Extraer host y puerto de URL HTTP (ej: http://192.168.1.100:3001)
    String url = String(API_BASE_URL);
    url.replace("http://", "");
    int colonPos = url.indexOf(':');
    if (colonPos > 0) {
      host = url.substring(0, colonPos);
      port = url.substring(colonPos + 1).toInt();
    } else {
      host = url;
      port = 80;
    }
  }

  WiFiClientSecure secureClient;
  WiFiClient plainClient;
  bool connected = false;
  
  Serial.printf("🔗 Conectando a %s:%d (%s)...\n", host.c_str(), port, useHTTPS ? "HTTPS" : "HTTP");
  
  if (useHTTPS) {
    secureClient.setInsecure();
    secureClient.setTimeout(5);
    connected = secureClient.connect(host.c_str(), port);
  } else {
    plainClient.setTimeout(5);
    connected = plainClient.connect(host.c_str(), port);
  }
  
  if (!connected) {
    Serial.println("❌ Conexión fallida");
    return false;
  }
  
  Serial.println("✅ Conectado, enviando petición...");
  
  // Preparar body JSON
  String body;
  serializeJson(doc, body);
  
  // Enviar petición HTTP POST
  if (useHTTPS) {
    secureClient.print("POST ");
    secureClient.print(endpoint);
    secureClient.println(" HTTP/1.1");
    secureClient.print("Host: ");
    secureClient.println(host);
    secureClient.println("Content-Type: application/json");
    secureClient.print("x-api-key: ");
    secureClient.println(API_KEY);
    secureClient.print("x-device-id: ");
    secureClient.println(DEVICE_ID);
    secureClient.print("Content-Length: ");
    secureClient.println(body.length());
    secureClient.println("Connection: close");
    secureClient.println();
    secureClient.print(body);
  } else {
    plainClient.print("POST ");
    plainClient.print(endpoint);
    plainClient.println(" HTTP/1.1");
    plainClient.print("Host: ");
    plainClient.println(host);
    plainClient.println("Content-Type: application/json");
    plainClient.print("x-api-key: ");
    plainClient.println(API_KEY);
    plainClient.print("x-device-id: ");
    plainClient.println(DEVICE_ID);
    plainClient.print("Content-Length: ");
    plainClient.println(body.length());
    plainClient.println("Connection: close");
    plainClient.println();
    plainClient.print(body);
  }
  
  // Debug: mostrar qué se está enviando
  Serial.printf("📤 Enviando a: %s%s\n", host.c_str(), endpoint);
  Serial.printf("🔑 API Key: %s\n", API_KEY);
  Serial.printf("🆔 Device ID: %s\n", DEVICE_ID);
  
  // Leer respuesta (headers y parte del cuerpo para debug)
  unsigned long timeout = millis() + 5000;
  bool headersReceived = false;
  int httpCode = 0;
  String responseBody = "";
  int lineCount = 0;
  
  bool stillConnected = useHTTPS ? secureClient.connected() : plainClient.connected();
  
  while (stillConnected && millis() < timeout && lineCount < 30) {
    bool hasData = useHTTPS ? secureClient.available() : plainClient.available();
    if (hasData) {
      String line = useHTTPS ? secureClient.readStringUntil('\n') : plainClient.readStringUntil('\n');
      lineCount++;
      
      if (line.startsWith("HTTP/1.")) {
        int codeStart = line.indexOf(' ');
        if (codeStart > 0) {
          int codeEnd = line.indexOf(' ', codeStart + 1);
          if (codeEnd > 0) {
            httpCode = line.substring(codeStart + 1, codeEnd).toInt();
          }
        }
        Serial.print("📥 ");
        Serial.println(line);
      } else if (!headersReceived) {
        // Mostrar headers importantes
        if (line.startsWith("Content-Type:") || line.startsWith("Content-Length:")) {
          Serial.print("📋 ");
          Serial.println(line);
        }
      }
      
      if (line == "\r" || line.length() == 0) {
        headersReceived = true;
        // Leer primera línea del cuerpo para ver el mensaje de error
        bool hasMoreData = useHTTPS ? secureClient.available() : plainClient.available();
        if (httpCode != 200 && hasMoreData) {
          responseBody = useHTTPS ? secureClient.readStringUntil('\n') : plainClient.readStringUntil('\n');
          Serial.print("📄 Respuesta: ");
          Serial.println(responseBody);
        }
        break;
      }
    }
    stillConnected = useHTTPS ? secureClient.connected() : plainClient.connected();
    delay(10);
  }
  
  if (useHTTPS) {
    secureClient.stop();
  } else {
    plainClient.stop();
  }
  
  if (httpCode == 200 || httpCode == 201) {
    Serial.printf("✅ HTTP: %d (Éxito)\n", httpCode);
    return true;
  } else if (httpCode == 401) {
    Serial.printf("❌ HTTP: %d (No autorizado)\n", httpCode);
    Serial.println("⚠️  Verifica que el API_KEY en el backend coincida con:");
    Serial.print("   DEVICE_001_API_KEY=");
    Serial.println(API_KEY);
    return false;
  } else if (httpCode > 0) {
    Serial.printf("⚠️ HTTP: %d\n", httpCode);
    return false;
  } else {
    Serial.println("⚠️ HTTP: Sin código de respuesta");
    return false;
  }
}

void sendStatus() {
  StaticJsonDocument<350> doc;
  doc["device_id"] = DEVICE_ID;
  doc["armed"] = alarmArmed;
  doc["siren"] = sirenState;
  doc["tamper"] = tamperState;
  doc["sensor_escalera"] = sensorEscaleraTriggered;  // Estado del sensor de escalera
  
  sendHTTPPost(API_STATUS, doc);
}

void handleSensorTrigger(bool triggered) {
  // Si la alarma está armada y el sensor se activó, disparar alarma
  if (alarmArmed && triggered) {
    Serial.println("🚨 ALARMA DISPARADA - Sensor de escalera activado!");
    sirenState = true;  // Activar sirena
    sendStatus();  // Enviar estado actualizado inmediatamente
  }
}

void sendHeartbeat() {
  StaticJsonDocument<300> doc;
  doc["device_id"] = DEVICE_ID;
  doc["uptime"] = millis() / 1000;
  doc["sensor_escalera"] = sensorEscaleraTriggered;  // Estado del sensor de escalera
  
  sendHTTPPost(API_HEART, doc);
}

void checkTamper() {
  bool now = digitalRead(PIN_TAMPER);
  
  if (now != lastTamperState) {
    tamperState = !now;  // Invertir porque INPUT_PULLUP
    lastTamperState = now;
    
    Serial.printf("🚨 Tamper: %s\n", tamperState ? "ACTIVADO" : "RESTAURADO");
    sendStatus();
  }
}

void checkSensorEscalera() {
  // Leer pin del sensor (nivel bajo = movimiento detectado)
  bool pinState = digitalRead(PIN_SENSOR_ESCALERA);
  bool movimientoDetectado = (pinState == LOW);  // LOW = movimiento
  
  // Detectar cambio de estado
  if (movimientoDetectado != sensorEscaleraTriggered) {
    sensorEscaleraTriggered = movimientoDetectado;
    
    if (sensorEscaleraTriggered) {
      Serial.println("👁️ Sensor Escalera: MOVIMIENTO DETECTADO");
      // Si la alarma está armada, disparar alarma
      handleSensorTrigger(true);
    } else {
      Serial.println("👁️ Sensor Escalera: Sin movimiento");
    }
    
    // Enviar estado actualizado al backend (incluye el estado del sensor)
    sendStatus();
  }
}

bool pollCommands() {
  if (WiFi.status() != WL_CONNECTED) {
    return false;
  }

  // Determinar si usar HTTPS o HTTP
  bool useHTTPS = (String(API_BASE_URL).startsWith("https://"));
  String host;
  int port;
  
  if (useHTTPS) {
    host = "api-alarma.puntopedido.com.ar";
    port = 443;
  } else {
    String url = String(API_BASE_URL);
    url.replace("http://", "");
    int colonPos = url.indexOf(':');
    if (colonPos > 0) {
      host = url.substring(0, colonPos);
      port = url.substring(colonPos + 1).toInt();
    } else {
      host = url;
      port = 80;
    }
  }

  WiFiClientSecure secureClient;
  WiFiClient plainClient;
  bool connected = false;
  
  if (useHTTPS) {
    secureClient.setInsecure();
    secureClient.setTimeout(3);
    connected = secureClient.connect(host.c_str(), port);
  } else {
    plainClient.setTimeout(3);
    connected = plainClient.connect(host.c_str(), port);
  }
  
  if (!connected) {
    return false;
  }
  
  // Enviar petición HTTP GET
  if (useHTTPS) {
    secureClient.print("GET ");
    secureClient.print(API_COMMANDS);
    secureClient.println(" HTTP/1.1");
    secureClient.print("Host: ");
    secureClient.println(host);
    secureClient.print("x-api-key: ");
    secureClient.println(API_KEY);
    secureClient.print("x-device-id: ");
    secureClient.println(DEVICE_ID);
    secureClient.println("Connection: close");
    secureClient.println();
  } else {
    plainClient.print("GET ");
    plainClient.print(API_COMMANDS);
    plainClient.println(" HTTP/1.1");
    plainClient.print("Host: ");
    plainClient.println(host);
    plainClient.print("x-api-key: ");
    plainClient.println(API_KEY);
    plainClient.print("x-device-id: ");
    plainClient.println(DEVICE_ID);
    plainClient.println("Connection: close");
    plainClient.println();
  }
  
  // Leer respuesta
  unsigned long timeout = millis() + 3000;
  bool headersReceived = false;
  String responseBody = "";
  int lineCount = 0;
  
  bool stillConnected = useHTTPS ? secureClient.connected() : plainClient.connected();
  
  while (stillConnected && millis() < timeout && lineCount < 30) {
    bool hasData = useHTTPS ? secureClient.available() : plainClient.available();
    if (hasData) {
      String line = useHTTPS ? secureClient.readStringUntil('\n') : plainClient.readStringUntil('\n');
      lineCount++;
      
      if (line == "\r" || line.length() == 0) {
        headersReceived = true;
        // Leer cuerpo de respuesta
        while (stillConnected && millis() < timeout) {
          bool hasMoreData = useHTTPS ? secureClient.available() : plainClient.available();
          if (hasMoreData) {
            char c = useHTTPS ? secureClient.read() : plainClient.read();
            responseBody += c;
            if (responseBody.length() > 500) break; // Limitar tamaño
          } else {
            break;
          }
          stillConnected = useHTTPS ? secureClient.connected() : plainClient.connected();
          delay(10);
        }
        break;
      }
    }
    stillConnected = useHTTPS ? secureClient.connected() : plainClient.connected();
    delay(10);
  }
  
  if (useHTTPS) {
    secureClient.stop();
  } else {
    plainClient.stop();
  }
  
  // Parsear JSON de respuesta
  if (responseBody.length() > 0) {
    StaticJsonDocument<300> doc;
    DeserializationError error = deserializeJson(doc, responseBody);
    
    if (!error && doc["success"].as<bool>() && doc["has_command"].as<bool>()) {
      String command = doc["command"].as<String>();
      bool value = doc["value"].as<bool>();
      int commandId = doc["command_id"] | 0;
      
      Serial.printf("📥 Comando recibido: %s = %s\n", command.c_str(), value ? "true" : "false");
      
      // Procesar comando
      if (command == "arm") {
        alarmArmed = value;
        Serial.printf("🔒 Alarma: %s\n", alarmArmed ? "ARMADA" : "DESARMADA");
        sendStatus();
      } else if (command == "disarm") {
        alarmArmed = false;
        sirenState = false;  // Desactivar sirena al desarmar
        Serial.printf("🔓 Alarma: DESARMADA\n");
        sendStatus();
      } else if (command == "siren") {
        sirenState = value;
        Serial.printf("🔊 Sirena: %s\n", sirenState ? "ACTIVADA" : "DESACTIVADA");
        sendStatus();
      } else if (command == "reset_tamper") {
        tamperState = false;
        lastTamperState = true;
        Serial.println("🔄 Tamper reseteado");
        sendStatus();
      }
      
      return true;
    }
  }
  
  return false;
}

void setup() {
  Serial.begin(115200);
  delay(1000);
  
  Serial.println("\n========================================");
  Serial.println("  FLOWSIGHT - Central de Alarma");
  Serial.println("  Versión Simple (sin FreeRTOS)");
  Serial.println("========================================\n");
  
  Serial.printf("💾 Free heap: %d bytes\n", ESP.getFreeHeap());
  Serial.printf("📦 Chip model: %s\n", ESP.getChipModel());
  Serial.println();
  
  pinMode(PIN_SIREN, OUTPUT);
  pinMode(PIN_LED, OUTPUT);
  pinMode(PIN_TAMPER, INPUT_PULLUP);
  pinMode(PIN_SENSOR_ESCALERA, INPUT_PULLUP);  // Sensor con pull-up interno
  
  digitalWrite(PIN_SIREN, HIGH);
  digitalWrite(PIN_LED, LOW);
  
  // Leer estado inicial del tamper
  lastTamperState = digitalRead(PIN_TAMPER);
  tamperState = !lastTamperState;
  
  // Leer estado inicial del sensor de escalera
  bool initialSensorState = digitalRead(PIN_SENSOR_ESCALERA);
  sensorEscaleraTriggered = (initialSensorState == LOW);  // LOW = movimiento
  lastSensorEscaleraState = initialSensorState;
  
  Serial.printf("👁️ Sensor Escalera inicial: %s\n", sensorEscaleraTriggered ? "MOVIMIENTO" : "SIN MOVIMIENTO");
  
  connectWiFi();
  
  // Enviar estado inicial
  delay(2000);
  sendStatus();
  
  Serial.println("✅ Sistema iniciado");
}

void loop() {
  unsigned long now = millis();
  
  // Verificar WiFi
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("⚠️ WiFi desconectado, reconectando...");
    connectWiFi();
    delay(2000);
  }
  
  // Heartbeat cada 60 segundos
  if (now - lastHeartbeat > HEARTBEAT_INTERVAL) {
    sendHeartbeat();
    lastHeartbeat = now;
  }
  
  // Status cada 30 segundos
  if (now - lastStatusUpdate > STATUS_INTERVAL) {
    sendStatus();
    lastStatusUpdate = now;
  }
  
  // Verificar tamper cada 200ms
  if (now - lastTamperCheck > TAMPER_CHECK_INTERVAL) {
    checkTamper();
    lastTamperCheck = now;
  }
  
  // Verificar sensor de escalera cada 100ms (para detectar pulsos rápidos)
  if (now - lastSensorCheck > SENSOR_CHECK_INTERVAL) {
    checkSensorEscalera();
    lastSensorCheck = now;
  }
  
  // Polling de comandos cada 5 segundos
  if (now - lastCommandPoll > COMMAND_POLL_INTERVAL) {
    pollCommands();
    lastCommandPoll = now;
  }
  
  // Control de Sirena
  static unsigned long lastSirenToggle = 0;
  if (sirenState) {
    // Sirena activa: patrón intermitente (500ms ON, 500ms OFF)
    if (now - lastSirenToggle > 500) {
      digitalWrite(PIN_SIREN, !digitalRead(PIN_SIREN));
      lastSirenToggle = now;
    }
  } else {
    // Sirena desactivada
    digitalWrite(PIN_SIREN, HIGH);  // Apagar (HIGH = apagado según tu configuración)
  }
  
  // Control LED (parpadea si alarma armada o tamper activo)
  static unsigned long lastLEDToggle = 0;
  static bool ledState = false;
  if (alarmArmed || tamperState || sirenState) {
    if (now - lastLEDToggle > 1000) {
      ledState = !ledState;
      digitalWrite(PIN_LED, ledState);
      lastLEDToggle = now;
    }
  } else {
    digitalWrite(PIN_LED, LOW);
    ledState = false;
  }
  
  delay(50);  // Pequeño delay para no saturar
}
