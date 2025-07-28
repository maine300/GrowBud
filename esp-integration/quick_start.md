# Quick Start Guide - Get Your ESP Running in 10 Minutes

## What You Need
- ESP32 or ESP8266 board
- DHT22 sensor (temperature/humidity)
- Soil moisture sensor
- 3-channel relay module
- Jumper wires
- Arduino IDE installed

## Step 1: Wire Everything Up (5 minutes)

### ESP32 Wiring
```
DHT22 Sensor:
  Red wire (VCC) → 3.3V pin
  Black wire (GND) → GND pin  
  Yellow wire (DATA) → GPIO 4

Soil Sensor:
  Red wire (VCC) → 3.3V pin
  Black wire (GND) → GND pin
  Yellow wire (A0) → GPIO 34

Relay Module:
  Red wire (VCC) → 5V pin (external power recommended)
  Black wire (GND) → GND pin
  Signal wires → GPIO 18, 19, 21
```

### ESP8266 Wiring  
```
DHT22 Sensor:
  Red wire (VCC) → 3.3V pin
  Black wire (GND) → GND pin
  Yellow wire (DATA) → D4

Soil Sensor:
  Red wire (VCC) → 3.3V pin
  Black wire (GND) → GND pin  
  Yellow wire (A0) → A0

Relay Module:
  Red wire (VCC) → 5V pin (external power)
  Black wire (GND) → GND pin
  Signal wires → D6, D7, D5
```

## Step 2: Install Libraries (2 minutes)

In Arduino IDE, go to Tools → Manage Libraries and install:
1. **ArduinoJson** by Benoit Blanchon
2. **DHT sensor library** by Adafruit  
3. **Adafruit Unified Sensor** by Adafruit

## Step 3: Configure Code (2 minutes)

Open the ESP code file and change these 3 lines:

```cpp
// Line 8-9: Your WiFi info
const char* ssid = "YOUR_WIFI_NAME";
const char* password = "YOUR_WIFI_PASSWORD";

// Line 12: Your web app URL (get this after deploying to Replit)
const char* serverURL = "https://your-app-name.replit.app";
```

## Step 4: Upload and Test (1 minute)

1. Connect ESP to computer via USB
2. Select your board type in Arduino IDE
3. Click Upload button
4. Open Serial Monitor (Tools → Serial Monitor, set to 115200 baud)

You should see:
```
Connecting to WiFi....
WiFi connected!
IP address: 192.168.1.100
Device light created with ID: abc123
Device fan created with ID: def456
Device pump created with ID: ghi789
Sensor data sent successfully
Temperature: 24°C, Humidity: 65%, Soil: 45%
```

## Step 5: Check Your Web App

Your ESP will automatically:
- ✅ Create 3 new devices (light, fan, pump) in your control panel
- ✅ Start sending real sensor data every 30 seconds  
- ✅ Respond to on/off commands from your web interface

## That's It!

Your ESP is now fully integrated with your plant monitoring system. You can:
- See real temperature, humidity, and soil moisture on your dashboard
- Control lights, fans, and pumps from your web app
- Monitor multiple plants with multiple ESP boards

## Troubleshooting

**ESP won't connect to WiFi:**
- Double-check WiFi name and password spelling
- Make sure you're using 2.4GHz WiFi (not 5GHz)
- Try moving ESP closer to router

**No sensor readings:**
- Check all wire connections
- Make sure sensors have power (3.3V)
- Verify pin numbers match your wiring

**Devices don't appear in web app:**
- Check serverURL is correct
- Make sure your web app is running
- Look for error messages in Serial Monitor

**Relays don't switch:**
- Relay modules usually need 5V power supply
- Check if your relay is "active high" or "active low" type
- Test with a multimeter

Need help? Check the detailed setup guide or ask for assistance!