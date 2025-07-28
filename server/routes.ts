import type { Express } from "express";
import { createServer, type Server } from "http";
import multer from "multer";
import path from "path";
import fs from "fs";
import { storage } from "./storage";
import { 
  insertPlantSchema, 
  insertSensorDataSchema, 
  insertCalendarEventSchema,
  insertBackupSchema,
  insertFeedingScheduleSchema
} from "@shared/schema";
import * as XLSX from 'xlsx';

// Configure multer for photo uploads
const photoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'photos');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `plant-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({ 
  storage: photoStorage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  }
});

// Configure multer for feeding schedule uploads
const scheduleStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'schedules');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `schedule-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const uploadSchedule = multer({
  storage: scheduleStorage,
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/pdf',
      'text/csv'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Only Excel, PDF, or CSV files are allowed'));
    }
  }
});

// Complete Cannabis Growing Schedule - Professional Grade
const CANNABIS_SCHEDULE = {
  complete: [
    // Germination (Days 0-7)
    { offset: 0, task: "Germinate seeds in paper towel method", stage: "seed" },
    { offset: 2, task: "Check for taproot emergence", stage: "seed" },
    { offset: 5, task: "Plant sprouted seeds in starter medium", stage: "seed" },
    
    // Seedling Stage (Days 7-21)
    { offset: 7, task: "First watering - pH 6.0-6.5, light misting", stage: "seedling" },
    { offset: 10, task: "Monitor for first true leaves", stage: "seedling" },
    { offset: 14, task: "Begin weak nutrients (200-400 PPM)", stage: "seedling" },
    { offset: 17, task: "Increase light to 18/6 schedule", stage: "seedling" },
    { offset: 21, task: "Transplant to 1-gallon containers", stage: "seedling" },
    
    // Early Vegetative (Days 21-42)
    { offset: 24, task: "Water/feed cycle - nutrients 400-600 PPM", stage: "vegetative" },
    { offset: 28, task: "First topping for bushier growth", stage: "vegetative" },
    { offset: 31, task: "Monitor for pest issues - neem oil spray", stage: "vegetative" },
    { offset: 35, task: "Increase nutrients to 600-800 PPM", stage: "vegetative" },
    { offset: 38, task: "LST (Low Stress Training) begins", stage: "vegetative" },
    { offset: 42, task: "Transplant to final containers (3-5 gallon)", stage: "vegetative" },
    
    // Mid Vegetative (Days 42-56)
    { offset: 45, task: "Full strength veg nutrients (800-1000 PPM)", stage: "vegetative" },
    { offset: 49, task: "Defoliation - remove lower fan leaves", stage: "vegetative" },
    { offset: 52, task: "SCROG setup if using (Screen of Green)", stage: "vegetative" },
    { offset: 56, task: "Final vegetative feeding", stage: "vegetative" },
    
    // Pre-Flower Transition (Days 56-63)
    { offset: 58, task: "Switch to 12/12 light cycle", stage: "flowering" },
    { offset: 60, task: "Begin transition nutrients (lower N, higher P-K)", stage: "flowering" },
    { offset: 63, task: "Watch for first pistils (flower sites)", stage: "flowering" },
    
    // Early Flowering (Days 63-84)
    { offset: 66, task: "Full flowering nutrients (1000-1200 PPM)", stage: "flowering" },
    { offset: 70, task: "Remove male plants if not feminized", stage: "flowering" },
    { offset: 73, task: "Lollipop lower branches (remove small buds)", stage: "flowering" },
    { offset: 77, task: "Monitor for nutrient burn - adjust if needed", stage: "flowering" },
    { offset: 80, task: "Increase P-K nutrients for bud development", stage: "flowering" },
    { offset: 84, task: "Check trichomes with jeweler's loupe", stage: "flowering" },
    
    // Mid-Late Flowering (Days 84-105)
    { offset: 87, task: "Reduce nitrogen further, max P-K", stage: "flowering" },
    { offset: 91, task: "Monitor trichomes - 10% amber for head high", stage: "flowering" },
    { offset: 94, task: "Check for bud rot and powdery mildew", stage: "flowering" },
    { offset: 98, task: "Begin flushing with pH'd water only", stage: "flowering" },
    { offset: 101, task: "Trichomes 20-30% amber for body effect", stage: "flowering" },
    { offset: 105, task: "Final flush - 48 hours darkness before harvest", stage: "flowering" },
    
    // Harvest (Days 105-145)
    { offset: 107, task: "Harvest when trichomes are 30% amber", stage: "harvest" },
    { offset: 108, task: "Wet trim fan leaves and sugar leaves", stage: "harvest" },
    { offset: 109, task: "Hang dry in 60°F, 60% humidity, dark room", stage: "harvest" },
    { offset: 115, task: "Check drying - stems should snap, not bend", stage: "harvest" },
    { offset: 117, task: "Begin curing in airtight jars", stage: "harvest" },
    { offset: 124, task: "Burp jars daily for first week of cure", stage: "harvest" },
    { offset: 131, task: "Burp jars every 2-3 days", stage: "harvest" },
    { offset: 145, task: "Optimal cure complete", stage: "harvest" },
  ]
};

const STAGE_PRESETS = {
  seed: CANNABIS_SCHEDULE.complete.filter(item => item.stage === "seed"),
  seedling: CANNABIS_SCHEDULE.complete.filter(item => item.stage === "seedling"),
  vegetative: CANNABIS_SCHEDULE.complete.filter(item => item.stage === "vegetative"),
  flowering: CANNABIS_SCHEDULE.complete.filter(item => item.stage === "flowering"),
  harvest: CANNABIS_SCHEDULE.complete.filter(item => item.stage === "harvest"),
  complete: CANNABIS_SCHEDULE.complete,
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Plants endpoints
  app.get("/api/plants", async (req, res) => {
    try {
      const plants = await storage.getPlants();
      res.json(plants);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plants" });
    }
  });

  app.get("/api/plants/:id", async (req, res) => {
    try {
      const plant = await storage.getPlant(req.params.id);
      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }
      res.json(plant);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch plant" });
    }
  });

  app.post("/api/plants", async (req, res) => {
    try {
      console.log("Received plant data:", req.body);
      const validatedData = insertPlantSchema.parse(req.body);
      console.log("Validated plant data:", validatedData);
      const plant = await storage.createPlant(validatedData);
      res.status(201).json(plant);
    } catch (error) {
      console.error("Plant creation error:", error);
      res.status(400).json({ error: "Invalid plant data", details: error });
    }
  });

  app.put("/api/plants/:id", async (req, res) => {
    try {
      const validatedData = insertPlantSchema.partial().parse(req.body);
      const plant = await storage.updatePlant(req.params.id, validatedData);
      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }
      res.json(plant);
    } catch (error) {
      res.status(400).json({ error: "Invalid plant data" });
    }
  });

  app.delete("/api/plants/:id", async (req, res) => {
    try {
      const deleted = await storage.deletePlant(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Plant not found" });
      }
      
      // Also delete related calendar events
      await storage.deleteCalendarEventsByPlant(req.params.id);
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete plant" });
    }
  });

  // Plant stage flip endpoint
  app.post("/api/plants/:id/flip-stage", async (req, res) => {
    try {
      const plant = await storage.getPlant(req.params.id);
      if (!plant) {
        return res.status(404).json({ error: "Plant not found" });
      }

      // Determine next stage
      const stageProgression = ["seed", "vegetative", "flowering", "harvest"];
      const currentIndex = stageProgression.indexOf(plant.stage);
      
      if (currentIndex === -1 || currentIndex === stageProgression.length - 1) {
        return res.status(400).json({ error: "Cannot advance stage further" });
      }

      const nextStage = stageProgression[currentIndex + 1];
      
      // Update plant stage
      const updatedPlant = await storage.updatePlant(req.params.id, { stage: nextStage });
      
      // Delete existing calendar events for this plant
      await storage.deleteCalendarEventsByPlant(req.params.id);
      
      // Generate new calendar events from today forward
      const today = new Date();
      
      // Filter schedule to start from the new stage
      const stageOrder = ["seed", "seedling", "vegetative", "flowering", "harvest"];
      const startIndex = stageOrder.indexOf(nextStage);
      
      let filteredSchedule = CANNABIS_SCHEDULE.complete;
      if (startIndex !== -1) {
        filteredSchedule = CANNABIS_SCHEDULE.complete.filter(item => {
          const itemStageIndex = stageOrder.indexOf(item.stage);
          return itemStageIndex >= startIndex;
        });
      }
      
      // Calculate minimum offset to normalize dates
      const minOffset = filteredSchedule.length > 0 ? Math.min(...filteredSchedule.map(item => item.offset)) : 0;
      
      // Create new calendar events
      for (const preset of filteredSchedule) {
        const eventDate = new Date(today);
        const normalizedOffset = preset.offset - minOffset;
        eventDate.setDate(eventDate.getDate() + normalizedOffset);
        
        await storage.createCalendarEvent({
          plantId: req.params.id,
          date: eventDate.toISOString().split('T')[0],
          task: preset.task,
          completed: false,
        });
      }
      
      res.json({ 
        plant: updatedPlant, 
        message: `Advanced to ${nextStage} stage and regenerated calendar` 
      });
    } catch (error) {
      console.error("Stage flip error:", error);
      res.status(500).json({ error: "Failed to flip plant stage" });
    }
  });

  // Photos endpoints
  app.get("/api/photos", async (req, res) => {
    try {
      const plantId = req.query.plantId as string;
      const photos = await storage.getPhotos(plantId);
      res.json(photos);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch photos" });
    }
  });

  app.post("/api/photos", upload.single('photo'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No photo uploaded" });
      }

      const { plantId } = req.body;
      if (!plantId) {
        return res.status(400).json({ error: "Plant ID is required" });
      }

      const photo = await storage.createPhoto({
        plantId,
        filename: req.file.filename,
        path: req.file.path,
      });

      res.status(201).json(photo);
    } catch (error) {
      res.status(500).json({ error: "Failed to upload photo" });
    }
  });

  app.get("/api/photos/:id/file", async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }

      if (!fs.existsSync(photo.path)) {
        return res.status(404).json({ error: "Photo file not found" });
      }

      res.sendFile(path.resolve(photo.path));
    } catch (error) {
      res.status(500).json({ error: "Failed to serve photo" });
    }
  });

  app.delete("/api/photos/:id", async (req, res) => {
    try {
      const photo = await storage.getPhoto(req.params.id);
      if (!photo) {
        return res.status(404).json({ error: "Photo not found" });
      }

      // Delete file
      if (fs.existsSync(photo.path)) {
        fs.unlinkSync(photo.path);
      }

      const deleted = await storage.deletePhoto(req.params.id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete photo" });
    }
  });

  // Sensor data endpoints
  app.get("/api/sensor-data", async (req, res) => {
    try {
      const latest = await storage.getLatestSensorData();
      
      // If no data exists, generate simulated data
      if (!latest) {
        const simulatedData = {
          temperature: Math.round(22 + Math.random() * 4), // 22-26°C
          humidity: Math.round(50 + Math.random() * 20), // 50-70%
          soilMoisture: Math.round(250 + Math.random() * 100), // 250-350 units
        };
        
        const sensorData = await storage.createSensorData(simulatedData);
        return res.json([sensorData]); // Return as array for consistency
      }
      
      res.json([latest]); // Return as array for consistency
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sensor data" });
    }
  });

  app.post("/api/sensor-data", async (req, res) => {
    try {
      const validatedData = insertSensorDataSchema.parse(req.body);
      const sensorData = await storage.createSensorData(validatedData);
      res.status(201).json(sensorData);
    } catch (error) {
      res.status(400).json({ error: "Invalid sensor data" });
    }
  });

  app.get("/api/sensor-data/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const history = await storage.getSensorDataHistory(limit);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch sensor history" });
    }
  });

  // Calendar events endpoints
  app.get("/api/calendar-events", async (req, res) => {
    try {
      const plantId = req.query.plantId as string;
      const events = await storage.getCalendarEvents(plantId);
      res.json(events);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar events" });
    }
  });

  app.post("/api/calendar-events", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(validatedData);
      res.status(201).json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid calendar event data" });
    }
  });

  app.post("/api/calendar-events/generate", async (req, res) => {
    try {
      const { plantId, stage, startDate } = req.body;
      
      if (!plantId || !stage || !startDate) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Generate complete schedule from selected stage to harvest
      let filteredSchedule = CANNABIS_SCHEDULE.complete;
      
      if (stage !== "complete") {
        const stageOrder = ["seed", "seedling", "vegetative", "flowering", "harvest"];
        const startIndex = stageOrder.indexOf(stage);
        if (startIndex === -1) {
          return res.status(400).json({ error: "Invalid stage" });
        }
        
        filteredSchedule = CANNABIS_SCHEDULE.complete.filter(item => {
          const itemStageIndex = stageOrder.indexOf(item.stage);
          return itemStageIndex >= startIndex;
        });
      }

      const events = [];
      const baseDate = new Date(startDate);
      
      // Calculate the minimum offset from the filtered schedule to normalize dates
      const minOffset = filteredSchedule.length > 0 ? Math.min(...filteredSchedule.map(item => item.offset)) : 0;

      for (const preset of filteredSchedule) {
        const eventDate = new Date(baseDate);
        // Normalize the offset so the first event starts on the selected date
        const normalizedOffset = preset.offset - minOffset;
        eventDate.setDate(eventDate.getDate() + normalizedOffset);
        
        const event = await storage.createCalendarEvent({
          plantId,
          date: eventDate.toISOString().split('T')[0], // YYYY-MM-DD format
          task: preset.task,
          completed: false,
        });
        
        events.push(event);
      }

      res.json({ success: true, events });
    } catch (error) {
      res.status(500).json({ error: "Failed to generate calendar events" });
    }
  });

  app.put("/api/calendar-events/:id", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.partial().parse(req.body);
      const event = await storage.updateCalendarEvent(req.params.id, validatedData);
      if (!event) {
        return res.status(404).json({ error: "Calendar event not found" });
      }
      res.json(event);
    } catch (error) {
      res.status(400).json({ error: "Invalid calendar event data" });
    }
  });

  app.delete("/api/calendar-events/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteCalendarEvent(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Calendar event not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete calendar event" });
    }
  });

  // Device control endpoints
  app.get("/api/devices", async (req, res) => {
    try {
      const devices = await storage.getDeviceStates();
      res.json(devices);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch device states" });
    }
  });

  app.post("/api/devices", async (req, res) => {
    try {
      const { plantId, deviceGroup, deviceType, name, isOn = false, autoMode = false, wattage, distanceFromPlant } = req.body;
      
      if (!deviceType || !name) {
        return res.status(400).json({ error: "Device type and name are required" });
      }

      const deviceData: any = {
        plantId,
        deviceGroup,
        deviceType,
        name,
        isOn,
        autoMode,
      };
      
      if (wattage !== undefined) deviceData.wattage = wattage;
      if (distanceFromPlant !== undefined) deviceData.distanceFromPlant = distanceFromPlant;

      const device = await storage.createDeviceState(deviceData);
      
      res.status(201).json(device);
    } catch (error) {
      res.status(400).json({ error: "Failed to create device" });
    }
  });

  app.put("/api/devices/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const updatedDevice = await storage.updateDeviceState(id, updateData);
      if (!updatedDevice) {
        return res.status(404).json({ error: "Device not found" });
      }
      
      res.json(updatedDevice);
    } catch (error) {
      res.status(500).json({ error: "Failed to update device" });
    }
  });

  app.delete("/api/devices/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteDeviceState(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Device not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete device" });
    }
  });

  // Legacy device toggle endpoint (for backward compatibility)
  app.post("/api/devices/:deviceType/toggle", async (req, res) => {
    try {
      const { deviceType } = req.params;
      const currentState = await storage.getDeviceState(deviceType);
      const newState = !currentState?.isOn;
      
      const updatedDevice = await storage.updateDeviceState(deviceType, newState as any);
      res.json(updatedDevice);
    } catch (error) {
      res.status(500).json({ error: "Failed to toggle device" });
    }
  });

  // Backup endpoints
  app.get("/api/backups", async (req, res) => {
    try {
      const backups = await storage.getBackups();
      res.json(backups);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch backups" });
    }
  });

  app.post("/api/backups", async (req, res) => {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `backup-${timestamp}.json`;
      
      // Create backup data
      const backupData = {
        plants: await storage.getPlants(),
        photos: await storage.getPhotos(),
        calendarEvents: await storage.getCalendarEvents(),
        deviceStates: await storage.getDeviceStates(),
        timestamp: new Date().toISOString(),
      };

      // Save backup file
      const backupDir = path.join(process.cwd(), 'backups');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }

      const filePath = path.join(backupDir, filename);
      fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2));

      const backup = await storage.createBackup({
        filename,
        size: fs.statSync(filePath).size,
      });

      res.status(201).json(backup);
    } catch (error) {
      res.status(500).json({ error: "Failed to create backup" });
    }
  });

  app.delete("/api/backups/:id", async (req, res) => {
    try {
      const backup = await storage.getBackups();
      const targetBackup = backup.find(b => b.id === req.params.id);
      
      if (!targetBackup) {
        return res.status(404).json({ error: "Backup not found" });
      }

      // Delete backup file
      const filePath = path.join(process.cwd(), 'backups', targetBackup.filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const deleted = await storage.deleteBackup(req.params.id);
      res.json({ success: deleted });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete backup" });
    }
  });

  // Feeding Schedule endpoints
  app.get("/api/feeding-schedules", async (req, res) => {
    try {
      const schedules = await storage.getFeedingSchedules();
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch feeding schedules" });
    }
  });

  app.post("/api/feeding-schedules", uploadSchedule.single('schedule'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No file uploaded" });
      }

      const { name, stage, potSize } = req.body;
      if (!name || !stage || !potSize) {
        return res.status(400).json({ error: "Missing required fields" });
      }

      // Process the uploaded file based on type
      let scheduleData: any[] = [];
      const filePath = req.file.path;
      const fileExtension = path.extname(req.file.originalname).toLowerCase();

      try {
        if (fileExtension === '.xlsx' || fileExtension === '.xls') {
          // Process Excel file
          const workbook = XLSX.readFile(filePath);
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          scheduleData = XLSX.utils.sheet_to_json(worksheet);
        } else if (fileExtension === '.csv') {
          // Process CSV file
          const csvContent = fs.readFileSync(filePath, 'utf8');
          const lines = csvContent.split('\n');
          const headers = lines[0].split(',').map(h => h.trim());
          
          scheduleData = lines.slice(1)
            .filter(line => line.trim())
            .map(line => {
              const values = line.split(',').map(v => v.trim());
              const row: any = {};
              headers.forEach((header, index) => {
                row[header] = values[index] || '';
              });
              return row;
            });
        } else if (fileExtension === '.pdf') {
          // PDF processing placeholder - user can enhance this
          scheduleData = [{
            week: 1,
            task: "PDF uploaded - manual processing needed",
            notes: "PDF file requires manual review"
          }];
        }

        // Clean up the uploaded file
        fs.unlinkSync(filePath);

        // Create feeding schedule record
        const feedingSchedule = await storage.createFeedingSchedule({
          name,
          stage,
          potSize,
          scheduleData,
        });

        res.status(201).json(feedingSchedule);
      } catch (fileError) {
        // Clean up file on error
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw fileError;
      }
    } catch (error) {
      console.error("Feeding schedule upload error:", error);
      res.status(400).json({ error: "Failed to process feeding schedule file" });
    }
  });

  app.delete("/api/feeding-schedules/:id", async (req, res) => {
    try {
      const deleted = await storage.deleteFeedingSchedule(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Feeding schedule not found" });
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete feeding schedule" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
