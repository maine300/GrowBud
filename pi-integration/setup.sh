#!/bin/bash
# Raspberry Pi Setup Script for Plant Monitoring Integration

echo "🌱 Setting up Raspberry Pi for Plant Monitoring System"

# Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Install Python dependencies
echo "🐍 Installing Python dependencies..."
sudo apt install -y python3-pip python3-venv python3-dev

# Install Pi-specific packages
echo "📷 Installing Pi Camera and GPIO libraries..."
sudo apt install -y python3-picamera python3-rpi.gpio

# Install sensor libraries (DHT22 for temperature/humidity)
echo "🌡️ Installing sensor libraries..."
pip3 install --user adafruit-circuitpython-dht
pip3 install --user requests schedule

# Create monitoring directory
echo "📁 Creating monitoring directory..."
mkdir -p ~/plant-monitor
cd ~/plant-monitor

# Download the Pi client script
echo "⬇️ Setting up monitoring script..."
cat > pi_client.py << 'EOF'
#!/usr/bin/env python3
"""
Raspberry Pi Client for Smart Plant Monitoring System
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

# CONFIGURATION - UPDATE THESE VALUES
API_BASE = "https://your-replit-app-name.replit.app"  # UPDATE THIS!
PLANT_ID = "your-plant-id-from-web-app"  # UPDATE THIS!

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
        
    def read_sensors(self):
        """Read sensor values"""
        try:
            # DHT22 sensor reading example
            # import adafruit_dht
            # import board
            # dht = adafruit_dht.DHT22(board.D4)
            # temperature = dht.temperature
            # humidity = dht.humidity
            
            # Simulated values for now - replace with actual sensor code
            temperature = 22
            humidity = 65
            soil_moisture = 45
            
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
        """Capture and upload photo"""
        try:
            from picamera import PiCamera
            import io
            
            camera = PiCamera()
            stream = io.BytesIO()
            camera.capture(stream, format='jpeg')
            stream.seek(0)
            
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
                
        except Exception as e:
            print(f"✗ Error capturing photo: {e}")
            return False
    
    def get_device_states(self):
        """Get device states and control hardware"""
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
        if HAS_GPIO:
            GPIO.output(LIGHT_PIN, is_on)
        print(f"💡 Light: {'ON' if is_on else 'OFF'}")
    
    def control_fan(self, is_on):
        if HAS_GPIO:
            GPIO.output(FAN_PIN, is_on)
        print(f"🌀 Fan: {'ON' if is_on else 'OFF'}")
    
    def control_pump(self, is_on):
        if HAS_GPIO:
            GPIO.output(PUMP_PIN, is_on)
        print(f"💧 Pump: {'ON' if is_on else 'OFF'}")
    
    def run_monitoring_cycle(self):
        print(f"\n--- Monitoring Cycle {datetime.now().strftime('%H:%M:%S')} ---")
        
        sensor_data = self.read_sensors()
        if sensor_data:
            self.send_sensor_data(sensor_data)
        
        self.get_device_states()
        print("--- Cycle Complete ---")
    
    def cleanup(self):
        if HAS_GPIO:
            GPIO.cleanup()

def main():
    monitor = PiPlantMonitor()
    
    print("🌱 Starting Pi Plant Monitor")
    print(f"🔗 Connected to: {API_BASE}")
    print(f"🆔 Plant ID: {PLANT_ID}")
    print("Press Ctrl+C to stop\n")
    
    photo_counter = 0
    
    try:
        while True:
            monitor.run_monitoring_cycle()
            
            # Take photo every hour (120 cycles)
            photo_counter += 1
            if photo_counter >= 120:
                monitor.capture_photo()
                photo_counter = 0
            
            time.sleep(30)
            
    except KeyboardInterrupt:
        print("\n🛑 Stopping monitor...")
    finally:
        monitor.cleanup()

if __name__ == "__main__":
    main()
EOF

# Make script executable
chmod +x pi_client.py

# Create systemd service for auto-start
echo "⚙️ Creating auto-start service..."
sudo tee /etc/systemd/system/plant-monitor.service > /dev/null << EOF
[Unit]
Description=Plant Monitoring System
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/plant-monitor
ExecStart=/usr/bin/python3 /home/pi/plant-monitor/pi_client.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable service (but don't start yet - user needs to configure first)
sudo systemctl enable plant-monitor.service

echo ""
echo "✅ Setup complete!"
echo ""
echo "📝 Next steps:"
echo "1. Edit ~/plant-monitor/pi_client.py"
echo "2. Update API_BASE with your Replit app URL"
echo "3. Update PLANT_ID with your plant's ID from web app"
echo "4. Test: python3 ~/plant-monitor/pi_client.py"
echo "5. Start service: sudo systemctl start plant-monitor"
echo "6. Check status: sudo systemctl status plant-monitor"
echo ""
echo "🔧 Configuration file: ~/plant-monitor/pi_client.py"
echo "📊 View logs: sudo journalctl -u plant-monitor -f"