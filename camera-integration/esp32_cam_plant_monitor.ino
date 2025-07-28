#include "esp_camera.h"
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <DHT.h>
#include "Base64.h"

// Camera model selection
#define CAMERA_MODEL_AI_THINKER
#include "camera_pins.h"

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Server Configuration
const char* serverURL = "https://your-app-name.replit.app";
const char* plantId = "YOUR_PLANT_ID"; // Required for photo association
const char* deviceGroup = "tent1";

// Sensor Pin Definitions (ESP32-CAM available pins)
#define DHT_PIN 13
#define DHT_TYPE DHT22
#define SOIL_PIN 12
#define RELAY_PIN 15
#define FLASH_PIN 4

// Timing Configuration
unsigned long lastSensorRead = 0;
unsigned long lastPhotoCapture = 0;
unsigned long lastDeviceCheck = 0;
const unsigned long SENSOR_INTERVAL = 30000;        // 30 seconds
const unsigned long PHOTO_INTERVAL = 3600000;       // 1 hour
const unsigned long DEVICE_CHECK_INTERVAL = 10000;  // 10 seconds

// Sensor setup
DHT dht(DHT_PIN, DHT_TYPE);

// Device state
bool relayState = false;
String relayDeviceId = "";

void setup() {
  Serial.begin(115200);
  
  // Initialize camera
  camera_config_t config;
  config.ledc_channel = LEDC_CHANNEL_0;
  config.ledc_timer = LEDC_TIMER_0;
  config.pin_d0 = Y2_GPIO_NUM;
  config.pin_d1 = Y3_GPIO_NUM;
  config.pin_d2 = Y4_GPIO_NUM;
  config.pin_d3 = Y5_GPIO_NUM;
  config.pin_d4 = Y6_GPIO_NUM;
  config.pin_d5 = Y7_GPIO_NUM;
  config.pin_d6 = Y8_GPIO_NUM;
  config.pin_d7 = Y9_GPIO_NUM;
  config.pin_xclk = XCLK_GPIO_NUM;
  config.pin_pclk = PCLK_GPIO_NUM;
  config.pin_vsync = VSYNC_GPIO_NUM;
  config.pin_href = HREF_GPIO_NUM;
  config.pin_sscb_sda = SIOD_GPIO_NUM;
  config.pin_sscb_scl = SIOC_GPIO_NUM;
  config.pin_pwdn = PWDN_GPIO_NUM;
  config.pin_reset = RESET_GPIO_NUM;
  config.xclk_freq_hz = 20000000;
  config.pixel_format = PIXFORMAT_JPEG;
  
  // Camera quality settings
  if(psramFound()){
    config.frame_size = FRAMESIZE_UXGA; // 1600x1200
    config.jpeg_quality = 10;
    config.fb_count = 2;
  } else {
    config.frame_size = FRAMESIZE_SVGA; // 800x600
    config.jpeg_quality = 12;
    config.fb_count = 1;
  }
  
  // Initialize camera
  esp_err_t err = esp_camera_init(&config);
  if (err != ESP_OK) {
    Serial.printf("Camera init failed with error 0x%x", err);
    return;
  }
  
  // Initialize other pins
  pinMode(RELAY_PIN, OUTPUT);
  pinMode(FLASH_PIN, OUTPUT);
  
  // Initialize DHT sensor
  dht.begin();
  
  // Connect to WiFi
  connectWiFi();
  
  // Initialize devices
  initializeDevices();
  
  Serial.println("ESP32-CAM Plant Monitor initialized");
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
  
  // Capture and send photos
  if (millis() - lastPhotoCapture >= PHOTO_INTERVAL) {
    captureAndSendPhoto();
    lastPhotoCapture = millis();
  }
  
  // Check device states
  if (millis() - lastDeviceCheck >= DEVICE_CHECK_INTERVAL) {
    checkDeviceStates();
    lastDeviceCheck = millis();
  }
  
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
  }
}

void readAndSendSensorData() {
  float humidity = dht.readHumidity();
  float temperature = dht.readTemperature();
  int soilRaw = analogRead(SOIL_PIN);
  int soilMoisture = map(soilRaw, 4095, 0, 0, 100);
  
  if (isnan(humidity) || isnan(temperature)) {
    Serial.println("Failed to read from DHT sensor!");
    return;
  }
  
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
  
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverURL) + "/api/sensor-data";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      Serial.printf("Sensor data sent: T:%.1f°C H:%.1f%% S:%d%%\n", 
                   temperature, humidity, soilMoisture);
    } else {
      Serial.printf("Error sending sensor data: %d\n", httpResponseCode);
    }
    
    http.end();
  }
}

void captureAndSendPhoto() {
  Serial.println("Capturing photo...");
  
  // Turn on flash for better photo quality
  digitalWrite(FLASH_PIN, HIGH);
  delay(100);
  
  // Capture photo
  camera_fb_t * fb = esp_camera_fb_get();
  
  // Turn off flash
  digitalWrite(FLASH_PIN, LOW);
  
  if (!fb) {
    Serial.println("Camera capture failed");
    return;
  }
  
  // Convert to base64 for upload
  String base64Image = base64::encode(fb->buf, fb->len);
  
  // Create JSON payload
  StaticJsonDocument<1000> doc;
  doc["plantId"] = plantId;
  doc["deviceGroup"] = deviceGroup;
  doc["imageData"] = base64Image;
  doc["timestamp"] = millis();
  doc["autoCapture"] = true;
  
  String jsonString;
  serializeJson(doc, jsonString);
  
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    String url = String(serverURL) + "/api/photos/camera";
    http.begin(url);
    http.addHeader("Content-Type", "application/json");
    http.setTimeout(30000); // 30 second timeout for large photos
    
    int httpResponseCode = http.POST(jsonString);
    
    if (httpResponseCode > 0) {
      Serial.printf("Photo uploaded successfully (Size: %d bytes)\n", fb->len);
    } else {
      Serial.printf("Error uploading photo: %d\n", httpResponseCode);
    }
    
    http.end();
  }
  
  // Return camera buffer
  esp_camera_fb_return(fb);
}

void initializeDevices() {
  createDevice("light", "Grow Light", RELAY_PIN);
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
  String url = String(serverURL) + "/api/devices";
  http.begin(url);
  http.addHeader("Content-Type", "application/json");
  
  int httpResponseCode = http.POST(jsonString);
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    
    StaticJsonDocument<500> responseDoc;
    deserializeJson(responseDoc, response);
    
    String deviceId = responseDoc["id"].as<String>();
    relayDeviceId = deviceId;
    
    Serial.printf("Device %s created with ID: %s\n", deviceType, deviceId.c_str());
  }
  
  http.end();
}

void checkDeviceStates() {
  if (WiFi.status() != WL_CONNECTED) return;
  
  HTTPClient http;
  String url = String(serverURL) + "/api/devices";
  http.begin(url);
  
  int httpResponseCode = http.GET();
  
  if (httpResponseCode > 0) {
    String response = http.getString();
    
    StaticJsonDocument<2000> doc;
    deserializeJson(doc, response);
    
    for (JsonObject device : doc.as<JsonArray>()) {
      String deviceId = device["id"].as<String>();
      bool isOn = device["isOn"].as<bool>();
      
      if (deviceId == relayDeviceId) {
        updateRelay(RELAY_PIN, isOn);
        relayState = isOn;
      }
    }
  }
  
  http.end();
}

void updateRelay(int pin, bool state) {
  digitalWrite(pin, state ? HIGH : LOW);
  Serial.printf("Relay pin %d set to %s\n", pin, state ? "ON" : "OFF");
}

// Manual photo capture function (can be triggered via API)
void capturePhotoOnDemand() {
  Serial.println("Manual photo capture requested");
  captureAndSendPhoto();
}