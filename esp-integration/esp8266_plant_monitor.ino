#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>
#include <ArduinoJson.h>
#include <DHT.h>

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* serverURL = "https://your-app-name.replit.app"; // Update with your Replit URL
const char* plantId = "YOUR_PLANT_ID"; // Optional: associate with specific plant
const char* deviceGroup = "tent1"; // Group name for shared sensors

// Pin Definitions (ESP8266 NodeMCU)
#define DHT_PIN 2        // D4
#define DHT_TYPE DHT22
#define SOIL_PIN A0      // A0
#define LIGHT_RELAY_PIN 12 // D6
#define FAN_RELAY_PIN 13   // D7
#define PUMP_RELAY_PIN 14  // D5
#define STATUS_LED_PIN 16  // D0

// Sensor and timing
DHT dht(DHT_PIN, DHT_TYPE);
unsigned long lastSensorRead = 0;
unsigned long lastDeviceCheck = 0;
const unsigned long SENSOR_INTERVAL = 30000; // 30 seconds
const unsigned long DEVICE_CHECK_INTERVAL = 10000; // 10 seconds

// Device states
bool lightState = false;
bool fanState = false;
bool pumpState = false;

// Device IDs (will be populated from server)
String lightDeviceId = "";
String fanDeviceId = "";
String pumpDeviceId = "";

WiFiClient wifiClient;

void setup() {
  Serial.begin(115200);
  
  // Initialize pins
  pinMode(LIGHT_RELAY_PIN, OUTPUT);
  pinMode(FAN_RELAY_PIN, OUTPUT);
  pinMode(PUMP_RELAY_PIN, OUTPUT);
  pinMode(STATUS_LED_PIN, OUTPUT);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize device states
  initializeDevices();
  
  Serial.println("ESP8266 Plant Monitor initialized");
}

void loop() {
  // Check WiFi connection
  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
  }
  
  // Read and send sensor data
  if (millis() - lastSensorRead >= SENSOR_INTERVAL) {
    readAndSendSensorData();
    lastSensorRead = millis();
  }
  
  // Check device states from server
  if (millis() - lastDeviceCheck >= DEVICE_CHECK_INTERVAL) {
    checkDeviceStates();
    lastDeviceCheck = millis();
  }
  
  // Update status LED
  digitalWrite(STATUS_LED_PIN, WiFi.status() == WL_CONNECTED ? LOW : HIGH); // LED is active low
  
  delay(100);
}

void connectWiFi() {
  Serial.print("Connecting to WiFi");
  WiFi.begin(ssid, password);
  
  int attempts = 0;
  while (WiFi.status() != WL_CONNECTED && attempts < 20) {
    delay(500);
    Serial.print(".");
    attempts++;
  }
  
  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("WiFi connected!");
    Serial.print("IP address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("WiFi connection failed!");
  }
}

void readAndSendSensorData() {
  // Read DHT22 sensor
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  
  // Read soil moisture (convert to percentage)
  int soilRaw = analogRead(SOIL_PIN);
  int soilMoisture = map(soilRaw, 1024, 0, 0, 100); // Invert and convert to percentage
  
  // Check if readings are valid
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  
  // Create JSON payload
  StaticJsonDocument<200> doc;
  doc["temperature"] = (int)temperature;
  doc["humidity"] = (int)humidity;
  doc["soilMoisture"] = soilMoisture;
  doc["deviceGroup"] = deviceGroup;
  
  if (strlen(plantId) > 0) {
    doc["plantId"] = plantId;
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  // Send to server
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(wifiClient, String(serverURL) + "/api/sensor-data");
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      String response = http.getString();
      Serial.println("Sensor data sent successfully");
      Serial.printf("Temperature: %.1f°C, Humidity: %.1f%%, Soil: %d%%\n", 
                   temperature, humidity, soilMoisture);
    } else {
      Serial.printf("Error sending sensor data: %d\n", httpResponseCode);
    }
    
    http.end();
  }
}

void initializeDevices() {
  // Create device entries on server if they don't exist
  createDevice("light", "Grow Light", LIGHT_RELAY_PIN);
  createDevice("fan", "Ventilation Fan", FAN_RELAY_PIN);
  createDevice("pump", "Water Pump", PUMP_RELAY_PIN);
}

void createDevice(const char* deviceType, const char* deviceName, int pin) {
  if (WiFi.status() != WL_CONNECTED) return;
  
  StaticJsonDocument<300> doc;
  doc["deviceType"] = deviceType;
  doc["name"] = deviceName;
  doc["location"] = deviceGroup;
  doc["isOn"] = false;
  doc["pin"] = pin;
  
  if (strlen(plantId) > 0) {
    doc["plantId"] = plantId;
  }
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  HTTPClient http;
  http.begin(wifiClient, String(serverURL) + "/api/devices");
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    
    // Parse response to get device ID
    StaticJsonDocument<500> responseDoc;
    deserializeJson(responseDoc, response);
    
    String deviceId = responseDoc["id"].as<String>();
    
    // Store device ID for future reference
    if (strcmp(deviceType, "light") == 0) {
      lightDeviceId = deviceId;
    } else if (strcmp(deviceType, "fan") == 0) {
      fanDeviceId = deviceId;
    } else if (strcmp(deviceType, "pump") == 0) {
      pumpDeviceId = deviceId;
    }
    
    Serial.printf("Device %s created with ID: %s\n", deviceType, deviceId.c_str());
  }
  
  http.end();
}

void checkDeviceStates() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  http.begin(wifiClient, String(serverURL) + "/api/devices");
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    
    StaticJsonDocument<2000> doc;
    deserializeJson(doc, response);
    
    // Process each device
    for (JsonObject device : doc.as<JsonArray>()) {
      String deviceId = device["id"].as<String>();
      String deviceType = device["deviceType"].as<String>();
      bool isOn = device["isOn"].as<bool>();
      
      // Update relay states based on server commands
      if (deviceId == lightDeviceId) {
        updateRelay(LIGHT_RELAY_PIN, isOn);
        lightState = isOn;
      } else if (deviceId == fanDeviceId) {
        updateRelay(FAN_RELAY_PIN, isOn);
        fanState = isOn;
      } else if (deviceId == pumpDeviceId) {
        updateRelay(PUMP_RELAY_PIN, isOn);
        pumpState = isOn;
      }
    }
  }
  
  http.end();
}

void updateRelay(int pin, bool state) {
  digitalWrite(pin, state ? HIGH : LOW);
  Serial.printf("Relay pin %d set to %s\n", pin, state ? "ON" : "OFF");
}

// Function to manually control devices (for physical buttons)
void toggleLight() {
  lightState = !lightState;
  updateRelay(LIGHT_RELAY_PIN, lightState);
  updateDeviceOnServer(lightDeviceId, lightState);
}

void toggleFan() {
  fanState = !fanState;
  updateRelay(FAN_RELAY_PIN, fanState);
  updateDeviceOnServer(fanDeviceId, fanState);
}

void togglePump() {
  pumpState = !pumpState;
  updateRelay(PUMP_RELAY_PIN, pumpState);
  updateDeviceOnServer(pumpDeviceId, pumpState);
}

void updateDeviceOnServer(String deviceId, bool state) {
  if (WiFi.status() != WL_CONNECTED || deviceId.length() == 0) return;
  
  StaticJsonDocument<100> doc;
  doc["isOn"] = state;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  HTTPClient http;
  http.begin(wifiClient, String(serverURL) + "/api/devices/" + deviceId);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.PUT(jsonString);
  
  if (httpResponseCode > 0) {
    Serial.printf("Device %s updated to %s\n", deviceId.c_str(), state ? "ON" : "OFF");
  }
  
  http.end();
}