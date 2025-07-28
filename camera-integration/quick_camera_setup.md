# Quick Camera Setup Guide

## Option 1: ESP32-CAM (Recommended - $15)

### What You Need
- ESP32-CAM module
- FTDI programmer (for uploading code)
- 5V power supply
- MicroSD card (optional, for local storage)

### Simple Wiring
```
ESP32-CAM connections:
- 5V power (separate from USB programmer)
- GND to common ground
- U0T to FTDI RX
- U0R to FTDI TX
- IO0 to GND (for programming mode)
```

### Features You Get
✅ **Automatic photos every hour** of your plants
✅ **Manual photo capture** from web interface
✅ **Growth time-lapse** creation
✅ **1600x1200 resolution** photos
✅ **Auto flash** for better image quality
✅ **Direct integration** with your plant monitoring system

### Setup Steps
1. **Upload the provided ESP32-CAM code**
2. **Change 3 settings**: WiFi name, password, server URL
3. **Position camera** at plant level
4. **Watch automatic photos** appear in your web app

## Option 2: IP Camera ($30-100)

### What You Need
- Any IP camera with HTTP streaming
- Camera positioned for plant monitoring
- Network access to camera stream

### Features You Get
✅ **Live video stream** in web interface
✅ **Higher resolution** (1080p-4K)
✅ **Night vision** (IR cameras)
✅ **Motion detection** alerts
✅ **Professional quality** footage

### Integration
Your web app can connect to camera streams via:
- RTSP URLs for live streaming
- HTTP snapshot URLs for photos
- Motion detection webhooks

## Option 3: USB Camera + Computer ($25-50)

### What You Need
- USB webcam or camera
- Always-on computer/Raspberry Pi
- Camera software for scheduling

### Features You Get
✅ **High quality** photos and video
✅ **Flexible positioning** with long USB cables
✅ **Software control** over settings
✅ **Time-lapse software** integration

## Comparison

| Feature | ESP32-CAM | IP Camera | USB Camera |
|---------|-----------|-----------|------------|
| **Cost** | $15 | $30-100 | $25-50 |
| **Setup** | Simple | Moderate | Complex |
| **Quality** | Good | Excellent | Very Good |
| **Integration** | Built-in | Good | Manual |
| **Power** | 5V only | PoE/12V | USB/Computer |
| **Reliability** | Very Good | Excellent | Good |

## Recommended Choice: ESP32-CAM

For plant monitoring, ESP32-CAM is perfect because:
- **Automatic integration** with your existing system
- **Low cost** and easy setup
- **Scheduled photography** built-in
- **Growth tracking** features ready
- **No additional computer** needed

## Quick Start with ESP32-CAM

1. **Get the hardware** (ESP32-CAM + FTDI programmer)
2. **Upload the code** I provided
3. **Update WiFi settings** and server URL
4. **Position camera** overlooking your plants
5. **Check web app** for automatic photos

Your plants will be photographed automatically, and you can create time-lapse videos of their growth!