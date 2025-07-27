# Raspberry Pi Integration Guide

## Overview
This guide shows how to connect your existing Raspberry Pi hardware to the new web-based plant monitoring system.

## Pi to Web App Integration

### 1. Sending Sensor Data
Your Pi can send sensor readings to the web app:

```python
import requests
import time

# Replace with your actual Replit app URL
API_BASE = "https://your-app.replit.app"

def send_sensor_data(temperature, humidity, soil_moisture):
    data = {
        "temperature": temperature,
        "humidity": humidity, 
        "soilMoisture": soil_moisture
    }
    
    try:
        response = requests.post(f"{API_BASE}/api/sensor-data", json=data)
        if response.status_code == 201:
            print("Sensor data sent successfully")
        else:
            print(f"Failed to send data: {response.status_code}")
    except Exception as e:
        print(f"Error sending data: {e}")

# Example usage - call this from your Pi sensor reading code
send_sensor_data(22, 65, 45)
```

### 2. Uploading Photos from Pi Camera
```python
import requests
from picamera import PiCamera
import io

def capture_and_upload(plant_id):
    camera = PiCamera()
    stream = io.BytesIO()
    
    # Capture image
    camera.capture(stream, format='jpeg')
    stream.seek(0)
    
    # Upload to web app
    files = {'photo': ('plant_photo.jpg', stream, 'image/jpeg')}
    data = {'plantId': plant_id}
    
    response = requests.post(f"{API_BASE}/api/photos", files=files, data=data)
    if response.status_code == 201:
        print("Photo uploaded successfully")
    
    camera.close()
```

### 3. Reading Device States (for controlling hardware)
```python
def get_device_states():
    try:
        response = requests.get(f"{API_BASE}/api/devices")
        if response.status_code == 200:
            devices = response.json()
            for device in devices:
                device_type = device['deviceType']
                is_on = device['isOn']
                
                # Control your Pi hardware based on state
                if device_type == 'light':
                    control_light(is_on)
                elif device_type == 'fan':
                    control_fan(is_on)
                elif device_type == 'pump':
                    control_pump(is_on)
                    
    except Exception as e:
        print(f"Error getting device states: {e}")

def control_light(is_on):
    # Your Pi GPIO code here
    # GPIO.output(LIGHT_PIN, is_on)
    pass

def control_fan(is_on):
    # Your Pi GPIO code here  
    # GPIO.output(FAN_PIN, is_on)
    pass

def control_pump(is_on):
    # Your Pi GPIO code here
    # GPIO.output(PUMP_PIN, is_on)
    pass
```

### 4. Complete Pi Integration Script
```python
#!/usr/bin/env python3
import requests
import time
import schedule
from datetime import datetime

API_BASE = "https://your-app.replit.app"

def main_loop():
    """Main Pi monitoring loop"""
    # Read sensors (replace with your actual sensor code)
    temperature = read_temperature_sensor()
    humidity = read_humidity_sensor() 
    soil_moisture = read_soil_sensor()
    
    # Send sensor data
    send_sensor_data(temperature, humidity, soil_moisture)
    
    # Check device states and control hardware
    get_device_states()

# Schedule tasks
schedule.every(30).seconds.do(main_loop)  # Check every 30 seconds
schedule.every(1).hours.do(lambda: capture_and_upload("your-plant-id"))  # Photo every hour

if __name__ == "__main__":
    print("Starting Pi integration...")
    while True:
        schedule.run_pending()
        time.sleep(1)
```

## Benefits of New System
- **Reliability**: Web app always accessible, no Pi downtime issues
- **Remote Access**: Monitor plants from anywhere
- **Better UI**: Modern interface with individual plant dashboards
- **Data Persistence**: PostgreSQL database vs JSON files
- **Scalability**: Easy to add more plants and features

## Migration Steps
1. Deploy the web app on Replit
2. Update your Pi scripts to use the new API endpoints
3. Test sensor data flow and device control
4. Migrate any existing plant data
5. Enjoy the improved system!