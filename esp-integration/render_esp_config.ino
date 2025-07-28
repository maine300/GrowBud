/*
 * ESP32/ESP8266 Configuration for Render Deployment
 * Update these settings for your Render-hosted app
 */

// WiFi Configuration
const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

// Render Server Configuration
const char* serverURL = "https://your-app-name.onrender.com";  // Replace with your Render app URL

// Optional Plant Association
const char* plantId = "";                      // Leave empty or add plant ID from web app
const char* deviceGroup = "tent1";             // Group name for multiple growing areas

/* 
 * IMPORTANT NOTES FOR RENDER:
 * 
 * 1. URL Format: https://your-app-name.onrender.com (no trailing slash)
 * 2. Free tier apps sleep after 15 minutes of inactivity
 * 3. First request after sleep takes 10-15 seconds to wake up
 * 4. Consider this when setting SENSOR_INTERVAL and DEVICE_CHECK_INTERVAL
 * 5. For production, consider upgrading to paid tier for no sleep
 */

// Timing Configuration (adjusted for Render free tier)
const unsigned long SENSOR_INTERVAL = 60000;        // 60 seconds (less frequent to prevent constant wake-ups)
const unsigned long DEVICE_CHECK_INTERVAL = 30000;  // 30 seconds
const unsigned long RETRY_DELAY = 20000;            // 20 seconds retry delay for sleeping apps

// Enhanced error handling for Render
bool serverIsAwake = true;
unsigned long lastSuccessfulRequest = 0;
const unsigned long SERVER_TIMEOUT = 60000;  // Assume server is sleeping after 60 seconds of failures