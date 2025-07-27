import { 
  type Plant, 
  type InsertPlant,
  type Photo,
  type InsertPhoto,
  type SensorData,
  type InsertSensorData,
  type CalendarEvent,
  type InsertCalendarEvent,
  type DeviceState,
  type InsertDeviceState,
  type Backup,
  type InsertBackup
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Plants
  getPlants(): Promise<Plant[]>;
  getPlant(id: string): Promise<Plant | undefined>;
  createPlant(plant: InsertPlant): Promise<Plant>;
  updatePlant(id: string, plant: Partial<InsertPlant>): Promise<Plant | undefined>;
  deletePlant(id: string): Promise<boolean>;

  // Photos
  getPhotos(plantId?: string): Promise<Photo[]>;
  getPhoto(id: string): Promise<Photo | undefined>;
  createPhoto(photo: InsertPhoto): Promise<Photo>;
  deletePhoto(id: string): Promise<boolean>;

  // Sensor Data
  getLatestSensorData(): Promise<SensorData | undefined>;
  createSensorData(data: InsertSensorData): Promise<SensorData>;
  getSensorDataHistory(limit?: number): Promise<SensorData[]>;

  // Calendar Events
  getCalendarEvents(plantId?: string): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;
  deleteCalendarEventsByPlant(plantId: string): Promise<boolean>;

  // Device States
  getDeviceStates(): Promise<DeviceState[]>;
  getDeviceState(deviceType: string): Promise<DeviceState | undefined>;
  updateDeviceState(deviceType: string, isOn: boolean): Promise<DeviceState>;

  // Backups
  getBackups(): Promise<Backup[]>;
  createBackup(backup: InsertBackup): Promise<Backup>;
  deleteBackup(id: string): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private plants: Map<string, Plant>;
  private photos: Map<string, Photo>;
  private sensorData: Map<string, SensorData>;
  private calendarEvents: Map<string, CalendarEvent>;
  private deviceStates: Map<string, DeviceState>;
  private backups: Map<string, Backup>;

  constructor() {
    this.plants = new Map();
    this.photos = new Map();
    this.sensorData = new Map();
    this.calendarEvents = new Map();
    this.deviceStates = new Map();
    this.backups = new Map();

    // Initialize device states
    this.initializeDeviceStates();
  }

  private initializeDeviceStates() {
    const devices = ['light', 'fan', 'pump'];
    devices.forEach(deviceType => {
      const id = randomUUID();
      const deviceState: DeviceState = {
        id,
        deviceType,
        isOn: false,
        lastToggled: new Date(),
      };
      this.deviceStates.set(deviceType, deviceState);
    });
  }

  // Plants
  async getPlants(): Promise<Plant[]> {
    return Array.from(this.plants.values());
  }

  async getPlant(id: string): Promise<Plant | undefined> {
    return this.plants.get(id);
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const id = randomUUID();
    const plant: Plant = {
      ...insertPlant,
      id,
      createdAt: new Date(),
    };
    this.plants.set(id, plant);
    return plant;
  }

  async updatePlant(id: string, updateData: Partial<InsertPlant>): Promise<Plant | undefined> {
    const existing = this.plants.get(id);
    if (!existing) return undefined;

    const updated: Plant = { ...existing, ...updateData };
    this.plants.set(id, updated);
    return updated;
  }

  async deletePlant(id: string): Promise<boolean> {
    return this.plants.delete(id);
  }

  // Photos
  async getPhotos(plantId?: string): Promise<Photo[]> {
    const photos = Array.from(this.photos.values());
    if (plantId) {
      return photos.filter(photo => photo.plantId === plantId);
    }
    return photos;
  }

  async getPhoto(id: string): Promise<Photo | undefined> {
    return this.photos.get(id);
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const id = randomUUID();
    const photo: Photo = {
      ...insertPhoto,
      id,
      capturedAt: new Date(),
    };
    this.photos.set(id, photo);
    return photo;
  }

  async deletePhoto(id: string): Promise<boolean> {
    return this.photos.delete(id);
  }

  // Sensor Data
  async getLatestSensorData(): Promise<SensorData | undefined> {
    const data = Array.from(this.sensorData.values());
    return data.sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())[0];
  }

  async createSensorData(insertData: InsertSensorData): Promise<SensorData> {
    const id = randomUUID();
    const data: SensorData = {
      ...insertData,
      id,
      recordedAt: new Date(),
    };
    this.sensorData.set(id, data);
    return data;
  }

  async getSensorDataHistory(limit = 100): Promise<SensorData[]> {
    const data = Array.from(this.sensorData.values());
    return data
      .sort((a, b) => b.recordedAt.getTime() - a.recordedAt.getTime())
      .slice(0, limit);
  }

  // Calendar Events
  async getCalendarEvents(plantId?: string): Promise<CalendarEvent[]> {
    const events = Array.from(this.calendarEvents.values());
    if (plantId) {
      return events.filter(event => event.plantId === plantId);
    }
    return events;
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = randomUUID();
    const event: CalendarEvent = {
      ...insertEvent,
      id,
      createdAt: new Date(),
    };
    this.calendarEvents.set(id, event);
    return event;
  }

  async updateCalendarEvent(id: string, updateData: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const existing = this.calendarEvents.get(id);
    if (!existing) return undefined;

    const updated: CalendarEvent = { ...existing, ...updateData };
    this.calendarEvents.set(id, updated);
    return updated;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }

  async deleteCalendarEventsByPlant(plantId: string): Promise<boolean> {
    const events = Array.from(this.calendarEvents.entries());
    let deleted = false;
    events.forEach(([id, event]) => {
      if (event.plantId === plantId) {
        this.calendarEvents.delete(id);
        deleted = true;
      }
    });
    return deleted;
  }

  // Device States
  async getDeviceStates(): Promise<DeviceState[]> {
    return Array.from(this.deviceStates.values());
  }

  async getDeviceState(deviceType: string): Promise<DeviceState | undefined> {
    return this.deviceStates.get(deviceType);
  }

  async updateDeviceState(deviceType: string, isOn: boolean): Promise<DeviceState> {
    const existing = this.deviceStates.get(deviceType);
    if (existing) {
      const updated: DeviceState = {
        ...existing,
        isOn,
        lastToggled: new Date(),
      };
      this.deviceStates.set(deviceType, updated);
      return updated;
    }

    // Create new device state if it doesn't exist
    const id = randomUUID();
    const newState: DeviceState = {
      id,
      deviceType,
      isOn,
      lastToggled: new Date(),
    };
    this.deviceStates.set(deviceType, newState);
    return newState;
  }

  // Backups
  async getBackups(): Promise<Backup[]> {
    return Array.from(this.backups.values())
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async createBackup(insertBackup: InsertBackup): Promise<Backup> {
    const id = randomUUID();
    const backup: Backup = {
      ...insertBackup,
      id,
      createdAt: new Date(),
    };
    this.backups.set(id, backup);
    return backup;
  }

  async deleteBackup(id: string): Promise<boolean> {
    return this.backups.delete(id);
  }
}

export const storage = new MemStorage();
