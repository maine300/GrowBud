# ESP32/ESP8266 Integration Guide

## Hardware Setup

### Required Components
- ESP32 or ESP8266 development board
- DHT22 temperature/humidity sensor
- Soil moisture sensor
- Relay modules (for lights, fans, pumps)
- Jumper wires
- Breadboard or PCB

### Pin Connections (ESP32)
```
DHT22 Sensor:
- VCC -> 3.3V
- GND -> GND  
- DATA -> GPIO 4

Soil Moisture Sensor:
- VCC -> 3.3V
- GND -> GND
- A0 -> GPIO 34 (analog input)

Relay Module (3 channels):
- VCC -> 5V (external power)
- GND -> GND
- IN1 -> GPIO 18 (Light control)
- IN2 -> GPIO 19 (Fan control) 
- IN3 -> GPIO 21 (Pump control)
```

### Pin Connections (ESP8266)
```
DHT22 Sensor:
- VCC -> 3.3V
- GND -> GND
- DATA -> GPIO 2 (D4)

Soil Moisture Sensor:
- VCC -> 3.3V
- GND -> GND
- A0 -> A0 (analog input)

Relay Module:
- VCC -> 5V (external power)
- GND -> GND
- IN1 -> GPIO 12 (D6) - Light
- IN2 -> GPIO 13 (D7) - Fan
- IN3 -> GPIO 14 (D5) - Pump
```

## Software Setup

### 1. Install Arduino IDE Libraries
Required libraries:
- `WiFi` (built-in)
- `HTTPClient` (built-in)
- `ArduinoJson` by Benoit Blanchon
- `DHT sensor library` by Adafruit
- `Adafruit Unified Sensor` by Adafruit

### 2. Configuration
Update the following in your ESP code:
- WiFi credentials
- Your web app URL (from Replit deployment)
- Plant ID (if associating with specific plant)
- Device group name

### 3. API Endpoints Used
- `POST /api/sensor-data` - Send sensor readings
- `GET /api/devices` - Get device states
- `POST /api/photos` - Upload camera images (if using ESP32-CAM)

## Features

### Automatic Functions
- Reads sensors every 30 seconds
- Sends data to web app automatically
- Controls devices based on web app commands
- Reconnects WiFi if connection lost
- Built-in watchdog timer for reliability

### Manual Override
- Physical buttons can override web controls
- Status LED shows connection and operation state
- Serial monitor for debugging

## Getting Started

1. Flash the provided ESP code to your board
2. Update WiFi and server settings
3. Connect sensors and relays according to pin diagram
4. Power on and check serial monitor for connection status
5. Verify data appears in your web dashboard

## Troubleshooting

### Common Issues
- **No WiFi connection**: Check credentials and signal strength
- **Sensor readings incorrect**: Verify pin connections and power
- **Relays not switching**: Check relay module power supply
- **Data not appearing**: Verify API URL and plant/device IDs

### Debug Mode
Enable serial debugging to see:
- WiFi connection status
- Sensor readings
- HTTP request/response details
- Device state changes