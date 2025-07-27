#!/usr/bin/env python3
"""
Raspberry Pi Client for Smart Plant Monitoring System
This script runs on your Pi and connects to the web-based monitoring system.
"""

import requests
import time
import json
from datetime import datetime
try:
    import RPi.GPIO as GPIO
    HAS_GPIO = True
except ImportError:
    print("Warning: RPi.GPIO not available. Running in simulation mode.")
    HAS_GPIO = False

# Configuration
API_BASE = "https://your-app.replit.app"  # Replace with your Replit app URL
PLANT_ID = "your-plant-id"  # Replace with actual plant ID from web app

# GPIO Pin Configuration (adjust for your setup)
LIGHT_PIN = 18
FAN_PIN = 19
PUMP_PIN = 20
TEMP_SENSOR_PIN = 4

class PiPlantMonitor:
    def __init__(self):
        if HAS_GPIO:
            GPIO.setmode(GPIO.BCM)
            GPIO.setup(LIGHT_PIN, GPIO.OUT)
            GPIO.setup(FAN_PIN, GPIO.OUT) 
            GPIO.setup(PUMP_PIN, GPIO.OUT)
            print("GPIO initialized")
        else:
            print("Running in simulation mode - no actual GPIO control")
    
    def read_sensors(self):
        """Read sensor values - replace with your actual sensor code"""
        try:
            # Simulate sensor readings or replace with actual sensor code
            # Example for DHT22 temperature/humidity sensor:
            # import Adafruit_DHT
            # humidity, temperature = Adafruit_DHT.read_retry(Adafruit_DHT.DHT22, TEMP_SENSOR_PIN)
            
            # For now, return simulated values
            temperature = 22  # Replace with actual reading
            humidity = 65     # Replace with actual reading
            soil_moisture = 45  # Replace with actual reading
            
            return {
                "temperature": int(temperature),
                "humidity": int(humidity),
                "soilMoisture": int(soil_moisture)
            }
        except Exception as e:
            print(f"Error reading sensors: {e}")
            return None
    
    def send_sensor_data(self, sensor_data):
        """Send sensor data to web app"""
        try:
            response = requests.post(
                f"{API_BASE}/api/sensor-data",
                json=sensor_data,
                timeout=10
            )
            if response.status_code == 201:
                print(f"✓ Sensor data sent: {sensor_data}")
                return True
            else:
                print(f"✗ Failed to send sensor data: {response.status_code}")
                return False
        except Exception as e:
            print(f"✗ Error sending sensor data: {e}")
            return False
    
    def capture_photo(self):
        """Capture photo using Pi camera and upload"""
        try:
            from picamera import PiCamera
            import io
            
            camera = PiCamera()
            stream = io.BytesIO()
            
            # Capture image
            camera.capture(stream, format='jpeg')
            stream.seek(0)
            
            # Upload to web app
            files = {'photo': ('plant_photo.jpg', stream, 'image/jpeg')}
            data = {'plantId': PLANT_ID}
            
            response = requests.post(
                f"{API_BASE}/api/photos",
                files=files,
                data=data,
                timeout=30
            )
            
            camera.close()
            
            if response.status_code == 201:
                print("✓ Photo uploaded successfully")
                return True
            else:
                print(f"✗ Failed to upload photo: {response.status_code}")
                return False
                
        except ImportError:
            print("Warning: PiCamera not available")
            return False
        except Exception as e:
            print(f"✗ Error capturing photo: {e}")
            return False
    
    def get_device_states(self):
        """Get device states from web app and control hardware"""
        try:
            response = requests.get(f"{API_BASE}/api/devices", timeout=10)
            if response.status_code == 200:
                devices = response.json()
                
                for device in devices:
                    device_type = device['deviceType']
                    is_on = device['isOn']
                    
                    if device_type == 'light':
                        self.control_light(is_on)
                    elif device_type == 'fan':
                        self.control_fan(is_on)
                    elif device_type == 'pump':
                        self.control_pump(is_on)
                
                return True
            else:
                print(f"✗ Failed to get device states: {response.status_code}")
                return False
                
        except Exception as e:
            print(f"✗ Error getting device states: {e}")
            return False
    
    def control_light(self, is_on):
        """Control grow light"""
        if HAS_GPIO:
            GPIO.output(LIGHT_PIN, is_on)
            print(f"💡 Light: {'ON' if is_on else 'OFF'}")
        else:
            print(f"💡 Light (simulated): {'ON' if is_on else 'OFF'}")
    
    def control_fan(self, is_on):
        """Control ventilation fan"""
        if HAS_GPIO:
            GPIO.output(FAN_PIN, is_on)
            print(f"🌀 Fan: {'ON' if is_on else 'OFF'}")
        else:
            print(f"🌀 Fan (simulated): {'ON' if is_on else 'OFF'}")
    
    def control_pump(self, is_on):
        """Control water pump"""
        if HAS_GPIO:
            GPIO.output(PUMP_PIN, is_on)
            print(f"💧 Pump: {'ON' if is_on else 'OFF'}")
        else:
            print(f"💧 Pump (simulated): {'ON' if is_on else 'OFF'}")
    
    def run_monitoring_cycle(self):
        """Run one complete monitoring cycle"""
        print(f"\n--- Monitoring Cycle {datetime.now().strftime('%H:%M:%S')} ---")
        
        # Read and send sensor data
        sensor_data = self.read_sensors()
        if sensor_data:
            self.send_sensor_data(sensor_data)
        
        # Check device states and control hardware
        self.get_device_states()
        
        print("--- Cycle Complete ---")
    
    def cleanup(self):
        """Cleanup GPIO on exit"""
        if HAS_GPIO:
            GPIO.cleanup()
            print("GPIO cleaned up")

def main():
    """Main monitoring loop"""
    monitor = PiPlantMonitor()
    
    print("🌱 Starting Pi Plant Monitor")
    print(f"🔗 Connected to: {API_BASE}")
    print(f"🆔 Plant ID: {PLANT_ID}")
    print("📊 Monitoring every 30 seconds...")
    print("📸 Photos every hour (if camera available)")
    print("Press Ctrl+C to stop\n")
    
    photo_counter = 0
    
    try:
        while True:
            # Run monitoring cycle every 30 seconds
            monitor.run_monitoring_cycle()
            
            # Take photo every hour (120 cycles * 30 seconds = 3600 seconds = 1 hour)
            photo_counter += 1
            if photo_counter >= 120:
                monitor.capture_photo()
                photo_counter = 0
            
            time.sleep(30)
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping Pi Plant Monitor...")
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
    finally:
        monitor.cleanup()

if __name__ == "__main__":
    main()