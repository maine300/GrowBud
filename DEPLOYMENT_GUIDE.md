# Smart Plant Monitoring System - Complete Setup Guide

## 🌱 System Overview

You now have a complete web-based plant monitoring system that replaces your old Raspberry Pi Flask setup with:

- **Modern Web Interface**: React dashboard with individual plant pages
- **Individual Plant Dashboards**: Each plant gets its own camera, calendar, and analytics
- **Database Storage**: PostgreSQL instead of JSON files for reliability
- **Pi Integration**: Your existing hardware works with the new system
- **Feeding Schedules**: Upload Excel/PDF schedules with color-coded growth stages

## 🚀 Deployment Steps

### 1. Deploy the Web Application

The web app is ready to deploy on Replit:

1. Click the **Deploy** button in Replit
2. Your app will be available at: `https://your-app-name.replit.app`
3. Copy this URL - you'll need it for Pi integration

### 2. Set Up Your Raspberry Pi

Transfer the setup script to your Pi and run it:

```bash
# On your Pi, download and run the setup script
wget https://your-app-name.replit.app/pi-integration/setup.sh
chmod +x setup.sh
sudo ./setup.sh
```

This automatically:
- Installs all required Python libraries
- Sets up the monitoring script
- Creates an auto-start service
- Configures GPIO for your hardware

### 3. Configure Pi Integration

Edit the configuration file:

```bash
nano ~/plant-monitor/pi_client.py
```

Update these lines:
```python
# CONFIGURATION - UPDATE THESE VALUES
API_BASE = "https://your-actual-replit-app.replit.app"  # Your Replit URL
PLANT_ID = "4cbad073-cfda-4484-a9b7-27a57d8e44e5"      # From web app
```

### 4. Test the Connection

Test your Pi integration:

```bash
cd ~/plant-monitor
python3 pi_client.py
```

You should see:
```
🌱 Starting Pi Plant Monitor
🔗 Connected to: https://your-app.replit.app
✓ Sensor data sent: {'temperature': 22, 'humidity': 65, 'soilMoisture': 45}
💡 Light: OFF
🌀 Fan: OFF  
💧 Pump: OFF
```

### 5. Start Automatic Monitoring

Enable the service to run automatically:

```bash
sudo systemctl start plant-monitor
sudo systemctl status plant-monitor
```

View live logs:
```bash
sudo journalctl -u plant-monitor -f
```

## 📱 Using the System

### Individual Plant Dashboards

1. **Main Dashboard**: Shows all plants, sensors, and device controls
2. **Add Plants**: Use the form to create new plants
3. **Individual Plant Pages**: Click any plant to access:
   - Plant-specific camera and photo history
   - Personal care calendar with color-coded stages
   - Growth analytics and stage tracking

### Camera Features

Each plant has its own camera section:
- **Take Photos**: Upload from device or Pi camera
- **Photo History**: See growth progression over time
- **Automatic Photos**: Pi takes photos every hour

### Calendar System

Color-coded growth stages:
- 🟡 **Seed** (Yellow): Initial planting phase
- 🟢 **Seedling** (Green): Early growth stage  
- 🔵 **Vegetative** (Blue): Active growth phase
- 🟣 **Flowering** (Purple): Reproductive stage
- 🟠 **Harvest** (Orange): Ready for harvest

### Feeding Schedules

Upload your feeding schedules:
1. Click "Upload Schedule" in any plant dashboard
2. Select Excel (.xlsx), PDF, or CSV file
3. Choose growth stage and pot size
4. System processes and applies color coding automatically

### Device Controls

Control your Pi hardware remotely:
- **Grow Lights**: Toggle on/off from web interface
- **Ventilation Fans**: Remote fan control
- **Water Pumps**: Automated watering control
- Pi reads these states every 30 seconds

## 🔧 Hardware Integration

### Your Existing Pi Hardware Works

The system integrates with your current setup:
- **DHT22 Sensors**: Temperature and humidity monitoring
- **Soil Moisture Sensors**: Real-time moisture readings
- **Pi Camera**: Automatic plant photography
- **Relay Controls**: Light, fan, and pump control
- **GPIO Pins**: Same pin configuration as before

### Sample GPIO Configuration

Default pin setup (customize in `pi_client.py`):
```python
LIGHT_PIN = 18    # Grow light relay
FAN_PIN = 19      # Ventilation fan
PUMP_PIN = 20     # Water pump
TEMP_SENSOR_PIN = 4  # DHT22 sensor
```

## 📊 Data Flow

1. **Sensors → Pi → Web App → Dashboard**
   - Pi reads sensors every 30 seconds
   - Data sent to web app API
   - Real-time display on dashboard

2. **Camera → Pi → Web App → Plant Gallery**
   - Pi captures photos hourly
   - Uploads to web app storage
   - Displays in individual plant dashboards

3. **Web Controls → Pi → Hardware**
   - Toggle devices on web interface
   - Pi polls for state changes
   - Hardware responds to commands

## 🎯 Benefits Over Old System

**Reliability**: Web interface stays up even if Pi restarts
**Individual Dashboards**: Each plant gets dedicated monitoring
**Better Data**: PostgreSQL database vs JSON files
**Remote Access**: Monitor from anywhere with internet
**Scalability**: Easy to add more plants and features
**Modern Interface**: Professional dashboard with real-time updates

## 🔍 Troubleshooting

### Pi Connection Issues
```bash
# Check service status
sudo systemctl status plant-monitor

# View detailed logs
sudo journalctl -u plant-monitor -f

# Test manual connection
python3 ~/plant-monitor/pi_client.py
```

### Web App Issues
- Check Replit console for errors
- Verify database connection
- Test API endpoints manually

### GPIO Issues
```bash
# Check GPIO permissions
ls -l /dev/gpiomem

# Verify pin configuration
gpio readall
```

## 🎉 You're Ready!

Your complete smart plant monitoring system is now operational with:
- ✅ Web dashboard deployed and running
- ✅ Individual plant dashboards with cameras
- ✅ Pi hardware integration configured  
- ✅ Automatic monitoring and controls
- ✅ Feeding schedule uploads ready
- ✅ Color-coded growth stage tracking

Access your system at: `https://your-app-name.replit.app`