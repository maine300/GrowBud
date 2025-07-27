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
import * as pdfParse from 'pdf-parse';

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
      cb(new Error('Only image files are allowed'), false);
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
      cb(new Error('Only Excel, PDF, or CSV files are allowed'), false);
    }
  }
});

// Stage presets for automated scheduling
const STAGE_PRESETS = {
  seed: [
    { offset: 0, task: "Soak seeds" },
    { offset: 1, task: "Plant in starter" },
    { offset: 3, task: "Check moisture" },
    { offset: 7, task: "Transplant to veg pot" }
  ],
  seedling: [
    { offset: 0, task: "Monitor humidity" },
    { offset: 2, task: "Gentle watering" },
    { offset: 5, task: "Check for growth" },
    { offset: 10, task: "Adjust lighting" }
  ],
  vegetative: [
    { offset: 0, task: "Start 18/6 light cycle" },
    { offset: 2, task: "Feed nutrients" },
    { offset: 7, task: "Check height" },
    { offset: 14, task: "Top plant" }
  ],
  flowering: [
    { offset: 0, task: "Switch to 12/12 lights" },
    { offset: 3, task: "Add bloom nutrients" },
    { offset: 10, task: "Trim lower leaves" },
    { offset: 21, task: "Check trichomes" }
  ]
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
        return res.json(sensorData);
      }
      
      res.json(latest);
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

      const presets = STAGE_PRESETS[stage as keyof typeof STAGE_PRESETS];
      if (!presets) {
        return res.status(400).json({ error: "Invalid stage" });
      }

      const events = [];
      const baseDate = new Date(startDate);

      for (const preset of presets) {
        const eventDate = new Date(baseDate);
        eventDate.setDate(eventDate.getDate() + preset.offset);
        
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

  app.post("/api/devices/:deviceType/toggle", async (req, res) => {
    try {
      const { deviceType } = req.params;
      const currentState = await storage.getDeviceState(deviceType);
      const newState = !currentState?.isOn;
      
      const updatedDevice = await storage.updateDeviceState(deviceType, newState);
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
          // Process PDF file
          const pdfBuffer = fs.readFileSync(filePath);
          const pdfData = await pdfParse(pdfBuffer);
          
          // Simple text parsing - extract lines that look like schedule data
          const lines = pdfData.text.split('\n')
            .filter(line => line.trim())
            .map((line, index) => ({
              week: Math.floor(index / 2) + 1,
              task: line.trim(),
              notes: ''
            }));
          
          scheduleData = lines;
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
