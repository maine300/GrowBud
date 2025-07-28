/* 
 * ESP Plant Monitor Configuration Template
 * Copy this file and customize for your setup
 */

#ifndef CONFIG_H
#define CONFIG_H

// ============================================
// REQUIRED: WiFi Settings
// ============================================
const char* ssid = "YOUR_WIFI_NAME";           // Replace with your WiFi network name
const char* password = "YOUR_WIFI_PASSWORD";   // Replace with your WiFi password

// ============================================
// REQUIRED: Server Settings  
// ============================================
const char* serverURL = "https://your-app-name.replit.app";  // Replace with your Replit app URL

// ============================================
// OPTIONAL: Plant Association
// ============================================
const char* plantId = "";                      // Leave empty, or add plant ID from web app URL
const char* deviceGroup = "tent1";             // Change to "tent2", "greenhouse", etc.

// ============================================
// PIN CONFIGURATION
// Choose ESP32 OR ESP8266 section below
// ============================================

#ifdef ESP32
// ESP32 Pin Configuration
#define DHT_PIN 4              // Temperature/humidity sensor
#define SOIL_PIN 34            // Soil moisture sensor (analog input)
#define LIGHT_RELAY_PIN 18     // Grow light relay control
#define FAN_RELAY_PIN 19       // Ventilation fan relay control
#define PUMP_RELAY_PIN 21      // Water pump relay control
#define STATUS_LED_PIN 2       // Built-in LED for status indication
#endif

#ifdef ESP8266
// ESP8266 Pin Configuration (NodeMCU labels in comments)
#define DHT_PIN 2        // D4 - Temperature/humidity sensor
#define SOIL_PIN A0      // A0 - Soil moisture sensor
#define LIGHT_RELAY_PIN 12 // D6 - Grow light relay control
#define FAN_RELAY_PIN 13   // D7 - Ventilation fan relay control
#define PUMP_RELAY_PIN 14  // D5 - Water pump relay control
#define STATUS_LED_PIN 16  // D0 - Built-in LED
#endif

// ============================================
// DEVICE NAMES (customize as needed)
// ============================================
const char* LIGHT_DEVICE_NAME = "Grow Light";
const char* FAN_DEVICE_NAME = "Ventilation Fan";
const char* PUMP_DEVICE_NAME = "Water Pump";

// ============================================
// TIMING SETTINGS (in milliseconds)
// ============================================
const unsigned long SENSOR_INTERVAL = 30000;        // How often to read sensors (30 seconds)
const unsigned long DEVICE_CHECK_INTERVAL = 10000;  // How often to check device commands (10 seconds)

// ============================================
// SENSOR CALIBRATION
// ============================================
// Soil moisture calibration (adjust based on your sensor)
#ifdef ESP32
const int SOIL_DRY_VALUE = 4095;    // Raw sensor value in completely dry soil
const int SOIL_WET_VALUE = 1500;    // Raw sensor value in saturated soil
#endif

#ifdef ESP8266
const int SOIL_DRY_VALUE = 1024;    // Raw sensor value in completely dry soil
const int SOIL_WET_VALUE = 300;     // Raw sensor value in saturated soil
#endif

// Temperature offset calibration (if your sensor reads high/low)
const float TEMP_OFFSET = 0.0;      // Add/subtract degrees to calibrate temperature
const float HUMIDITY_OFFSET = 0.0;  // Add/subtract percentage to calibrate humidity

#endif