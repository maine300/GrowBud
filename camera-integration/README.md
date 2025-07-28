# Camera Integration Guide

## Camera Options for Plant Monitoring

### 1. ESP32-CAM Module (Recommended)
- **Pros**: Built-in WiFi, programmable, integrates with existing ESP system
- **Cons**: Lower resolution than dedicated cameras
- **Resolution**: Up to 2MP (1600x1200)
- **Cost**: $10-15

### 2. USB Camera + Raspberry Pi
- **Pros**: Higher resolution, more features
- **Cons**: Requires separate device, more complex setup
- **Resolution**: Up to 4K depending on camera
- **Cost**: $50-100+

### 3. IP Camera
- **Pros**: Easy setup, high resolution, night vision options
- **Cons**: More expensive, requires separate network setup
- **Resolution**: 1080p to 4K
- **Cost**: $30-200+

## ESP32-CAM Integration (Easiest)

### Hardware Setup
```
ESP32-CAM Module connections:
- 5V power supply (ESP32-CAM needs more power than regular ESP32)
- FTDI programmer for initial upload
- Optional: External antenna for better WiFi
```

### Features
- **Automatic plant photos** on schedule
- **Motion detection** for growth monitoring
- **Time-lapse creation** from scheduled photos
- **Manual photo capture** from web interface
- **Growth comparison** between photos

### Pin Configuration
```cpp
// ESP32-CAM has fixed camera pins
#define CAMERA_MODEL_AI_THINKER
#include "esp_camera.h"

// Additional sensors can use:
#define DHT_PIN 13        // Available GPIO
#define SOIL_PIN 12       // Available GPIO
#define RELAY_PIN 15      // Available GPIO
```

## Web Interface Camera Features

### Photo Capture
- **Manual capture** button in plant detail view
- **Scheduled capture** based on growth stage
- **Bulk photo management** for time-lapse creation

### Growth Tracking
- **Before/after comparisons** 
- **Height measurement overlay** on photos
- **Growth rate visualization** with photo timeline
- **Stage progression documentation**

## Implementation Options

### Option 1: ESP32-CAM Only
- Replace your ESP32 with ESP32-CAM
- Keep all existing sensors
- Add camera functionality
- Most cost-effective upgrade

### Option 2: Add ESP32-CAM to Existing Setup
- Keep current ESP32 for sensors
- Add ESP32-CAM dedicated for photos
- Allows optimal placement for both sensors and camera
- Better reliability (camera issues don't affect sensors)

### Option 3: IP Camera Integration
- Add IP camera to network
- Create camera API endpoints
- Stream to web interface
- Most professional but most expensive

## Camera Placement Tips

### Lighting Considerations
- **Avoid direct grow lights** in camera view (overexposure)
- **Use diffused lighting** for even photos
- **Consider IR cameras** for 24/7 monitoring
- **Mount at plant level** for best growth documentation

### Positioning
- **Fixed mount** for consistent comparison photos
- **Side angle** to capture plant height and structure
- **Multiple cameras** for different angles (if budget allows)
- **Weatherproof housing** for greenhouse/outdoor setups

## Advanced Features

### Time-lapse Creation
- Automatic photo capture every few hours
- Server-side video generation from photos
- Growth progression visualization
- Shareable time-lapse videos

### AI Integration
- **Plant health detection** from photos
- **Growth stage identification**
- **Pest/disease early warning**
- **Automated care recommendations**

### Motion Detection
- **Growth activity alerts**
- **Security monitoring**
- **Visitor detection** (for outdoor grows)
- **Equipment monitoring**