from flask import Flask, render_template, jsonify, request, redirect, url_for
import RPi.GPIO as GPIO
import os
from datetime import datetime, timedelta
import uuid
import json
import requests
from picamera import PiCamera
from time import sleep
import calendar
from dotenv import load_dotenv
import logging

# Initialize logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s', filename='/home/pi/MyPlantApp/flask.log')
logger = logging.getLogger(__name__)

# Load environment variables
load_dotenv()
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN')
TELEGRAM_CHAT_ID = os.getenv('TELEGRAM_CHAT_ID')

app = Flask(__name__)

# Plant stages
STAGE_PRESETS = {
    "seed": [
        {"offset": 0, "task": "Soak seeds"},
        {"offset": 1, "task": "Plant in starter"},
        {"offset": 3, "task": "Check moisture"},
        {"offset": 7, "task": "Transplant to veg pot"}
    ],
    "veg": [
        {"offset": 0, "task": "Start 18/6 light cycle"},
        {"offset": 2, "task": "Feed nutrients"},
        {"offset": 7, "task": "Check height"},
        {"offset": 14, "task": "Top plant"}
    ],
    "flower": [
        {"offset": 0, "task": "Switch to 12/12 lights"},
        {"offset": 3, "task": "Add bloom nutrients"},
        {"offset": 10, "task": "Trim lower leaves"},
        {"offset": 21, "task": "Check trichomes"}
    ]
}

# File paths
PLANTS_FILE = '/home/pi/MyPlantApp/plants.json'
PHOTO_FOLDER = '/home/pi/MyPlantApp/static/photos'
CALENDAR_FILE = '/home/pi/MyPlantApp/calendar_data.json'

# Initialize files and directories
os.makedirs(PHOTO_FOLDER, exist_ok=True)
if not os.path.exists(PLANTS_FILE):
    with open(PLANTS_FILE, 'w') as f:
        json.dump([], f)
if not os.path.exists(CALENDAR_FILE):
    with open(CALENDAR_FILE, 'w') as f:
        json.dump({}, f)

# GPIO pins
LIGHT_PIN = 17
FAN_PIN = 27
PUMP_PIN = 22

def setup_gpio():
    try:
        GPIO.setwarnings(False)
        GPIO.setmode(GPIO.BCM)
        GPIO.setup(LIGHT_PIN, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(FAN_PIN, GPIO.OUT, initial=GPIO.LOW)
        GPIO.setup(PUMP_PIN, GPIO.OUT, initial=GPIO.LOW)
        logger.info("GPIO setup completed")
    except Exception as e:
        logger.error(f"GPIO setup failed: {e}")

def toggle(pin):
    try:
        GPIO.output(pin, not GPIO.input(pin))
        logger.info(f"Toggled GPIO pin {pin}")
    except Exception as e:
        logger.error(f"Failed to toggle GPIO pin {pin}: {e}")

def send_telegram_message(text, image_path=None):
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        data = {"chat_id": TELEGRAM_CHAT_ID, "text": text}
        response = requests.post(url, data=data)
        response.raise_for_status()
        logger.info(f"Sent Telegram message: {text}")

        if image_path and os.path.exists(image_path):
            url_photo = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendPhoto"
            with open(image_path, "rb") as photo:
                response = requests.post(url_photo, data={"chat_id": TELEGRAM_CHAT_ID}, files={"photo": photo})
                response.raise_for_status()
                logger.info(f"Sent Telegram photo: {image_path}")
    except requests.RequestException as e:
        logger.error(f"Telegram error: {e}")

def load_plants():
    try:
        if os.path.exists(PLANTS_FILE):
            with open(PLANTS_FILE, 'r') as f:
                return json.load(f)
        logger.info("Plants file not found, returning empty list")
        return []
    except json.JSONDecodeError as e:
        logger.error(f"Error loading plants: {e}")
        return []
    except Exception as e:
        logger.error(f"Unexpected error loading plants: {e}")
        return []

def save_plants(plants):
    try:
        with open(PLANTS_FILE, 'w') as f:
            json.dump(plants, f, indent=2)
        logger.info("Plants saved successfully")
    except Exception as e:
        logger.error(f"Error saving plants: {e}")

def load_calendar_data():
    try:
        if os.path.exists(CALENDAR_FILE):
            with open(CALENDAR_FILE, 'r') as f:
                return json.load(f)
        logger.info("Calendar file not found, returning empty dict")
        return {}
    except json.JSONDecodeError as e:
        logger.error(f"Error loading calendar data: {e}")
        return {}
    except Exception as e:
        logger.error(f"Unexpected error loading calendar data: {e}")
        return {}

def save_calendar_data(data):
    try:
        with open(CALENDAR_FILE, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info("Calendar data saved successfully")
    except Exception as e:
        logger.error(f"Error saving calendar data: {e}")

plants = load_plants()

@app.route('/health')
def health_check():
    try:
        return jsonify({'status': 'ok', 'message': 'Server is running', 'timestamp': datetime.now().isoformat()})
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return jsonify({'status': 'error', 'message': f'Health check failed: {str(e)}'}), 500

@app.route('/')
def home():
    return render_template('index.html', plants=plants)

@app.route('/plants')
def list_plants():
    return render_template('plants.html', plants=plants)

@app.route('/sensor-data', methods=['POST'])
def receive_sensor_data():
    data = request.json
    print("Received sensor data:", data)
    return jsonify({"message": "Sensor data received"}), 200

@app.route('/control', methods=['POST'])
def control():
    try:
        device = request.json.get('device')
        if device == 'light':
            toggle(LIGHT_PIN)
        elif device == 'fan':
            toggle(FAN_PIN)
        elif device == 'pump':
            toggle(PUMP_PIN)
        return jsonify({'status': 'ok'})
    except Exception as e:
        logger.error(f"Control endpoint failed: {e}")
        return jsonify({'status': 'error', 'message': str(e)}), 500

@app.route('/capture/<plant_id>', methods=['POST'])
def capture(plant_id):
    plant = next((p for p in plants if p["id"] == plant_id), None)
    if not plant:
        logger.error(f"Plant not found: {plant_id}")
        return jsonify({'error': 'Plant not found'}), 404

    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    filename = os.path.join(PHOTO_FOLDER, f'{plant_id}_{timestamp}.jpg')

    try:
        camera = PiCamera()
        camera.resolution = (1024, 768)
        sleep(2)  # Camera warm-up
        camera.capture(filename)
        camera.close()
        logger.info(f"Photo captured: {filename}")

        send_telegram_message(f"New photo for plant {plant['name']}", image_path=filename)
        return redirect(url_for('view_plant', plant_id=plant_id))
    except Exception as e:
        logger.error(f"Failed to capture photo: {e}")
        return jsonify({'error': f'Failed to capture photo: {str(e)}'}), 500

@app.route('/plant/<plant_id>')
def view_plant(plant_id):
    plant = next((p for p in plants if p["id"] == plant_id), None)
    if not plant:
        logger.error(f"Plant not found: {plant_id}")
        return "Plant not found", 404

    # Photos
    prefix = f"{plant_id}_"
    try:
        photo_files = sorted(
            [f for f in os.listdir(PHOTO_FOLDER) if f.startswith(prefix) and f.endswith('.jpg')],
            key=lambda x: os.path.getmtime(os.path.join(PHOTO_FOLDER, x)),
            reverse=True
        )
        latest_photo = photo_files[0] if photo_files else None
        photo_history = photo_files[1:6] if len(photo_files) > 1 else []
        logger.info(f"Loaded {len(photo_files)} photos for plant {plant_id}")
    except Exception as e:
        logger.error(f"Error loading photos for plant {plant_id}: {e}")
        latest_photo = None
        photo_history = []

    # Calendar
    today = datetime.date.today()
    year = today.year
    month = today.month
    month_days = calendar.monthrange(year, month)[1]
    month_name = calendar.month_name[month]

    return render_template(
        'plant.html',
        plant=plant,
        latest_photo=latest_photo,
        photo_history=photo_history,
        year=year,
        month=month,
        month_name=month_name,
        timestamp=int(datetime.now().timestamp())
    )

@app.route('/latest-photo')
def latest_photo():
    try:
        photos = [f for f in os.listdir(PHOTO_FOLDER) if f.endswith('.jpg')]
        if not photos:
            logger.info("No photos available")
            return "No photos available", 404
        latest_photo = max(photos, key=lambda f: os.path.getmtime(os.path.join(PHOTO_FOLDER, f)))
        logger.info(f"Latest photo: {latest_photo}")
        return render_template('photo.html', photo_url=os.path.join(PHOTO_FOLDER, latest_photo))
    except Exception as e:
        logger.error(f"Error loading latest photo: {e}")
        return "Error loading photo", 500

@app.route('/photo/<filename>')
def view_photo(filename):
    filepath = os.path.join(PHOTO_FOLDER, filename)
    if not os.path.exists(filepath):
        logger.error(f"Photo not found: {filename}")
        return "Photo not found", 404
    return render_template('photo.html', photo_url=filepath)

@app.route('/add-plant', methods=['POST'])
def add_plant():
    try:
        name = request.form.get('name')
        strain_type = request.form.get('strain_type')
        location = request.form.get('location')
        stage = request.form.get('stage')

        if not all([name, strain_type, location, stage]):
            logger.error("Add plant failed: Missing required fields")
            return jsonify({'error': 'All fields are required'}), 400
        if stage not in STAGE_PRESETS:
            logger.error(f"Add plant failed: Invalid stage {stage}")
            return jsonify({'error': 'Invalid stage'}), 400

        plant_id = str(uuid.uuid4())[:8]
        plant = {
            'id': plant_id,
            'name': name,
            'strain_type': strain_type,
            'location': location,
            'stage': stage
        }
        plants.append(plant)
        save_plants(plants)
        logger.info(f"Added plant: {plant_id}")
        return redirect(url_for('home'))
    except Exception as e:
        logger.error(f"Error adding plant: {e}")
        return jsonify({'error': f'Failed to add plant: {str(e)}'}), 500

@app.route("/api/calendar/<plant_id>", methods=["GET"])
def get_calendar(plant_id):
    try:
        data = load_calendar_data()
        logger.info(f"Loaded calendar data for plant {plant_id}")
        return jsonify(data.get(plant_id, {}))
    except Exception as e:
        logger.error(f"Error retrieving calendar for plant {plant_id}: {e}")
        return jsonify({"error": f"Failed to load calendar: {str(e)}"}), 500

@app.route("/api/calendar/generate/<plant_id>", methods=["POST"])
def generate_calendar(plant_id):
    try:
        req = request.json
        start_date_str = req.get("start_date")
        stage = req.get("stage")

        if not start_date_str or not stage or stage not in STAGE_PRESETS:
            logger.error(f"Generate calendar failed for plant {plant_id}: Invalid request")
            return jsonify({"error": "Invalid request"}), 400

        start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        data = load_calendar_data()
        if plant_id not in data:
            data[plant_id] = {}

        for entry in STAGE_PRESETS[stage]:
            task_date = start_date + timedelta(days=entry["offset"])
            date_str = task_date.strftime("%Y-%m-%d")
            data[plant_id][date_str] = entry["task"]

        save_calendar_data(data)
        logger.info(f"Generated calendar for plant {plant_id}, stage {stage}")
        return jsonify(success=True)
    except Exception as e:
        logger.error(f"Error generating calendar for plant {plant_id}: {e}")
        return jsonify({"error": f"Failed to generate calendar: {str(e)}"}), 500

@app.route("/api/calendar/<plant_id>", methods=["POST"])
def update_calendar(plant_id):
    try:
        req = request.json
        date = req.get("date")
        action = req.get("action")

        data = load_calendar_data()
        if plant_id not in data:
            data[plant_id] = {}
        if action.strip() == "":
            data[plant_id].pop(date, None)
        else:
            data[plant_id][date] = action
        save_calendar_data(data)
        logger.info(f"Updated calendar for plant {plant_id} on {date}")
        return jsonify(success=True)
    except Exception as e:
        logger.error(f"Error updating calendar for plant {plant_id}: {e}")
        return jsonify({"error": f"Failed to update calendar: {str(e)}"}), 500

@app.route("/api/calendar/<plant_id>", methods=["PUT"])
def add_calendar(plant_id):
    try:
        req = request.json
        date = req.get("date")
        action = req.get("action")

        if not date or not action:
            logger.error(f"Add calendar failed for plant {plant_id}: Missing date or action")
            return jsonify({"error": "Date and action are required"}), 400

        data = load_calendar_data()
        if plant_id not in data:
            data[plant_id] = {}
        data[plant_id][date] = action
        save_calendar_data(data)
        logger.info(f"Added calendar entry for plant {plant_id} on {date}")
        return jsonify(success=True)
    except Exception as e:
        logger.error(f"Error adding calendar entry for plant {plant_id}: {e}")
        return jsonify({"error": f"Failed to add calendar entry: {str(e)}"}), 500

@app.route("/api/calendar/<plant_id>", methods=["DELETE"])
def delete_calendar(plant_id):
    try:
        data = load_calendar_data()
        if plant_id in data:
            del data[plant_id]
            save_calendar_data(data)
            logger.info(f"Deleted calendar for plant {plant_id}")
        return jsonify(success=True)
    except Exception as e:
        logger.error(f"Error deleting calendar for plant {plant_id}: {e}")
        return jsonify({"error": f"Failed to delete calendar: {str(e)}"}), 500

if __name__ == '__main__':
    try:
        setup_gpio()
        logger.info("Starting Flask server")
        app.run(host='0.0.0.0', port=5000, debug=True, use_reloader=False)
    except Exception as e:
        logger.error(f"Failed to start Flask server: {e}")
    finally:
        GPIO.cleanup()
        logger.info("GPIO cleanup completed")
