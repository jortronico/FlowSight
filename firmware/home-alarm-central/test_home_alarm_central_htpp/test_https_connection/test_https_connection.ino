/*
  Programa de prueba de conexión HTTPS para ESP32
  Basado en ejemplo de RandomNerdTutorials.com
  
  Este programa prueba la conexión HTTPS básica sin FreeRTOS
  para diagnosticar problemas de conexión.
*/

#include <Arduino.h>
#include <WiFi.h>
#include <WiFiClientSecure.h>

const char* ssid = "Fibertel WiFi649 2.4GHz";
const char* password = "0042237126";

// URL del servidor de prueba
const char* server = "www.howsmyssl.com";
// Tu servidor real
const char* api_server = "api-alarma.puntopedido.com.ar";

WiFiClientSecure client;

void setup() {
  //Initialize serial and wait for port to open:
  Serial.begin(115200);
  delay(100);

  Serial.print("Attempting to connect to SSID: ");
  Serial.println(ssid);
  WiFi.begin(ssid, password);

  // attempt to connect to Wifi network:
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print(".");
    // wait 1 second for re-trying
    delay(1000);
  }

  Serial.print("Connected to ");
  Serial.println(ssid);

  client.setInsecure();

  Serial.println("\nStarting connection to server...");
  if (!client.connect(server, 443))
    Serial.println("Connection failed!");
  else {
    Serial.println("Connected to server!");
    // Make a HTTP request:
    client.println("GET https://www.howsmyssl.com/a/check HTTP/1.0");
    client.println("Host: www.howsmyssl.com");
    client.println("Connection: close");
    client.println();

    while (client.connected()) {
      String line = client.readStringUntil('\n');
      if (line == "\r") {
        Serial.println("headers received");
        break;
      }
    }
    // if there are incoming bytes available
    // from the server, read them and print them:
    while (client.available()) {
      char c = client.read();
      Serial.write(c);
    }

    client.stop();
  }
}

void loop() {
  // do nothing
}
