# ESP Setup Guide - Step by Step

## Step 1: Configure Your Settings

### Update WiFi Credentials
In your ESP code, change these lines:
```cpp
const char* ssid = "YOUR_WIFI_SSID";        // Replace with your WiFi name
const char* password = "YOUR_WIFI_PASSWORD"; // Replace with your WiFi password
```

### Update Server URL
After you deploy your app to Replit, update this line:
```cpp
const char* serverURL = "https://your-app-name.replit.app"; // Replace with your actual Replit URL
```

### Optional: Link to Specific Plant
If you want this ESP to be associated with a specific plant:
```cpp
const char* plantId = "YOUR_PLANT_ID"; // Get this from your web app plant page URL
```

### Set Device Group Name
For organizing multiple ESPs (like different grow tents):
```cpp
const char* deviceGroup = "tent1"; // Change to "tent2", "greenhouse", etc.
```

## Step 2: Pin Configuration

### Default Pin Setup (ESP32)
```cpp
#define DHT_PIN 4              // Temperature/humidity sensor
#define SOIL_PIN 34            // Soil moisture sensor (analog)
#define LIGHT_RELAY_PIN 18     // Grow light relay control
#define FAN_RELAY_PIN 19       // Ventilation fan relay
#define PUMP_RELAY_PIN 21      // Water pump relay
#define STATUS_LED_PIN 2       // Status LED (built-in)
```

### Default Pin Setup (ESP8266)
```cpp
#define DHT_PIN 2        // D4 - Temperature/humidity sensor
#define SOIL_PIN A0      // A0 - Soil moisture sensor
#define LIGHT_RELAY_PIN 12 // D6 - Grow light relay
#define FAN_RELAY_PIN 13   // D7 - Ventilation fan relay
#define PUMP_RELAY_PIN 14  // D5 - Water pump relay
#define STATUS_LED_PIN 16  // D0 - Status LED
```

### Customize Pins (if needed)
If your wiring is different, just change the pin numbers:
```cpp
#define LIGHT_RELAY_PIN 5   // Change to whatever pin you used
#define FAN_RELAY_PIN 16    // Change to whatever pin you used
// etc.
```

## Step 3: Device Names

### Customize Device Names
The ESP automatically creates devices with these names:
```cpp
createDevice("light", "Grow Light", LIGHT_RELAY_PIN);
createDevice("fan", "Ventilation Fan", FAN_RELAY_PIN);
createDevice("pump", "Water Pump", PUMP_RELAY_PIN);
```

You can change the display names:
```cpp
createDevice("light", "Main LED Array", LIGHT_RELAY_PIN);
createDevice("fan", "Exhaust Fan", FAN_RELAY_PIN);
createDevice("pump", "Drip System", PUMP_RELAY_PIN);
```

## Step 4: Sensor Calibration

### Soil Moisture Calibration
The soil sensor might need calibration for your specific setup:

**ESP32:**
```cpp
// Default mapping (you may need to adjust)
int soilMoisture = map(soilRaw, 4095, 0, 0, 100);

// To calibrate:
// 1. Put sensor in dry soil, note the reading
// 2. Put sensor in wet soil, note the reading
// 3. Update the mapping:
int soilMoisture = map(soilRaw, DRY_VALUE, WET_VALUE, 0, 100);
```

**ESP8266:**
```cpp
// Default mapping
int soilMoisture = map(soilRaw, 1024, 0, 0, 100);

// Calibrated version:
int soilMoisture = map(soilRaw, DRY_VALUE, WET_VALUE, 0, 100);
```

## Step 5: Advanced Customization

### Add More Sensors
To add a light sensor (LDR):
```cpp
#define LIGHT_SENSOR_PIN 35  // ESP32 analog pin

// In readAndSendSensorData():
int lightLevel = analogRead(LIGHT_SENSOR_PIN);
int lightPercent = map(lightLevel, 0, 4095, 0, 100);
doc["lightLevel"] = lightPercent;
```

### Add More Devices
To control additional devices:
```cpp
#define HEATER_RELAY_PIN 22
bool heaterState = false;
String heaterDeviceId = "";

// In initializeDevices():
createDevice("heater", "Space Heater", HEATER_RELAY_PIN);

// In checkDeviceStates(), add another condition:
else if (deviceId == heaterDeviceId) {
  updateRelay(HEATER_RELAY_PIN, isOn);
  heaterState = isOn;
}
```

### Adjust Timing
Change how often data is sent:
```cpp
const unsigned long SENSOR_INTERVAL = 60000;   // Send every 60 seconds instead of 30
const unsigned long DEVICE_CHECK_INTERVAL = 5000; // Check devices every 5 seconds
```

## Step 6: Testing and Debugging

### Serial Monitor Output
After uploading, open Serial Monitor (115200 baud) to see:
```
Connecting to WiFi....
WiFi connected!
IP address: 192.168.1.100
Device light created with ID: abc123
Device fan created with ID: def456
Sensor data sent successfully
Temperature: 24°C, Humidity: 65%, Soil: 45%
```

### Troubleshooting Common Issues

**WiFi won't connect:**
- Check SSID and password spelling
- Make sure WiFi is 2.4GHz (ESP8266 doesn't support 5GHz)
- Check signal strength

**Sensor readings are wrong:**
- Check wiring connections
- Verify pin numbers in code match your wiring
- Use multimeter to test sensors

**Devices not showing in web app:**
- Check server URL is correct
- Make sure your web app is running
- Check serial monitor for HTTP error codes

**Relays not switching:**
- Check relay module power supply (usually needs 5V)
- Verify relay trigger type (some are active LOW)
- Test with multimeter

### Status LED Meanings
- **ON (ESP32) / OFF (ESP8266)**: WiFi connected, working normally
- **OFF (ESP32) / ON (ESP8266)**: WiFi disconnected or connecting

## Step 7: Multiple ESP Setup

### For Multiple Growing Areas
Each ESP should have a unique device group:
```cpp
// ESP in tent 1:
const char* deviceGroup = "tent1";

// ESP in tent 2:
const char* deviceGroup = "tent2";

// ESP in greenhouse:
const char* deviceGroup = "greenhouse";
```

### Plant-Specific ESPs
Link each ESP to monitor a specific plant:
```cpp
// Get plant ID from your web app URL when viewing the plant
const char* plantId = "abc123-def456-ghi789";
```

This way each plant can have its own dedicated sensors and controls!