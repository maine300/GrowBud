import { 
  type Plant, 
  type InsertPlant,
  type Photo,
  type InsertPhoto,
  type SensorData,
  type InsertSensorData,
  type CalendarEvent,
  type InsertCalendarEvent,
  type FeedingSchedule,
  type InsertFeedingSchedule,
  type DeviceState,
  type InsertDeviceState,
  type Backup,
  type InsertBackup
} from "@shared/schema";
import { db } from "./db";
import { eq, and } from "drizzle-orm";
import { 
  plants, 
  photos, 
  sensorData, 
  calendarEvents, 
  feedingSchedules,
  deviceStates, 
  backups 
} from "@shared/schema";
import { randomUUID } from "crypto";
import { sql } from "drizzle-orm";

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
  deletePhotosByPlant(plantId: string): Promise<boolean>;

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

  // Feeding Schedules
  getFeedingSchedules(): Promise<FeedingSchedule[]>;
  getFeedingSchedule(id: string): Promise<FeedingSchedule | undefined>;
  createFeedingSchedule(schedule: InsertFeedingSchedule): Promise<FeedingSchedule>;
  deleteFeedingSchedule(id: string): Promise<boolean>;

  // Device States
  getDeviceStates(): Promise<DeviceState[]>;
  getDeviceState(deviceType: string): Promise<DeviceState | undefined>;
  createDeviceState(device: InsertDeviceState): Promise<DeviceState>;
  updateDeviceState(id: string, updates: Partial<InsertDeviceState>): Promise<DeviceState | undefined>;
  deleteDeviceState(id: string): Promise<boolean>;
  deleteDeviceStatesByPlant(plantId: string): Promise<boolean>;

  // Backups
  getBackups(): Promise<Backup[]>;
  createBackup(backup: InsertBackup): Promise<Backup>;
  deleteBackup(id: string): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async initializeDeviceStates() {
    const existingDevices = await db.select().from(deviceStates);
    
    if (existingDevices.length === 0) {
      const devices = ['light', 'fan', 'pump'];
      for (const deviceType of devices) {
        await db.insert(deviceStates).values({
          deviceType,
          isOn: false,
        });
      }
    }
  }

  // Plants
  async getPlants(): Promise<Plant[]> {
    return await db.select().from(plants);
  }

  async getPlant(id: string): Promise<Plant | undefined> {
    const [plant] = await db.select().from(plants).where(eq(plants.id, id));
    return plant || undefined;
  }

  async createPlant(insertPlant: InsertPlant): Promise<Plant> {
    const [plant] = await db.insert(plants).values(insertPlant).returning();
    return plant;
  }

  async updatePlant(id: string, updateData: Partial<InsertPlant>): Promise<Plant | undefined> {
    const [plant] = await db.update(plants).set(updateData).where(eq(plants.id, id)).returning();
    return plant || undefined;
  }

  async deletePlant(id: string): Promise<boolean> {
    try {
      // First delete related records
      await db.delete(photos).where(eq(photos.plantId, id));
      await db.delete(calendarEvents).where(eq(calendarEvents.plantId, id));
      
      // Then delete the plant
      const result = await db.delete(plants).where(eq(plants.id, id));
      return result.rowCount > 0;
    } catch (error) {
      console.error("Error deleting plant:", error);
      return false;
    }
  }

  // Photos
  async getPhotos(plantId?: string): Promise<Photo[]> {
    if (plantId) {
      return await db.select().from(photos).where(eq(photos.plantId, plantId));
    }
    return await db.select().from(photos);
  }

  async getPhoto(id: string): Promise<Photo | undefined> {
    const [photo] = await db.select().from(photos).where(eq(photos.id, id));
    return photo || undefined;
  }

  async createPhoto(insertPhoto: InsertPhoto): Promise<Photo> {
    const [photo] = await db.insert(photos).values(insertPhoto).returning();
    return photo;
  }

  async deletePhoto(id: string): Promise<boolean> {
    const result = await db.delete(photos).where(eq(photos.id, id));
    return result.rowCount > 0;
  }

  async deletePhotosByPlant(plantId: string): Promise<boolean> {
    const result = await db.delete(photos).where(eq(photos.plantId, plantId));
    return result.rowCount > 0;
  }

  // Sensor Data
  async getLatestSensorData(): Promise<SensorData | undefined> {
    const [data] = await db.select().from(sensorData).orderBy(sql`recorded_at DESC`).limit(1);
    return data || undefined;
  }

  async createSensorData(insertData: InsertSensorData): Promise<SensorData> {
    const [data] = await db.insert(sensorData).values(insertData).returning();
    return data;
  }

  async getSensorDataHistory(limit = 100): Promise<SensorData[]> {
    return await db.select().from(sensorData).orderBy(sql`recorded_at DESC`).limit(limit);
  }

  // Calendar Events
  async getCalendarEvents(plantId?: string): Promise<CalendarEvent[]> {
    if (plantId) {
      return await db.select().from(calendarEvents).where(eq(calendarEvents.plantId, plantId));
    }
    return await db.select().from(calendarEvents);
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const [event] = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return event || undefined;
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const [event] = await db.insert(calendarEvents).values(insertEvent).returning();
    return event;
  }

  async updateCalendarEvent(id: string, updateData: Partial<InsertCalendarEvent>): Promise<CalendarEvent | undefined> {
    const [event] = await db.update(calendarEvents).set(updateData).where(eq(calendarEvents.id, id)).returning();
    return event || undefined;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return result.rowCount > 0;
  }

  async deleteCalendarEventsByPlant(plantId: string): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.plantId, plantId));
    return result.rowCount > 0;
  }

  // Feeding Schedules
  async getFeedingSchedules(): Promise<FeedingSchedule[]> {
    return await db.select().from(feedingSchedules);
  }

  async getFeedingSchedule(id: string): Promise<FeedingSchedule | undefined> {
    const [schedule] = await db.select().from(feedingSchedules).where(eq(feedingSchedules.id, id));
    return schedule || undefined;
  }

  async createFeedingSchedule(schedule: InsertFeedingSchedule): Promise<FeedingSchedule> {
    const [newSchedule] = await db.insert(feedingSchedules).values(schedule).returning();
    return newSchedule;
  }

  async deleteFeedingSchedule(id: string): Promise<boolean> {
    const result = await db.delete(feedingSchedules).where(eq(feedingSchedules.id, id));
    return result.rowCount > 0;
  }

  // Device States
  async getDeviceStates(): Promise<DeviceState[]> {
    return await db.select().from(deviceStates);
  }

  async getDeviceState(deviceType: string): Promise<DeviceState | undefined> {
    const [device] = await db.select().from(deviceStates).where(eq(deviceStates.deviceType, deviceType));
    return device || undefined;
  }

  async createDeviceState(device: InsertDeviceState): Promise<DeviceState> {
    const [newDevice] = await db.insert(deviceStates).values(device).returning();
    return newDevice;
  }

  async updateDeviceState(id: string, updates: Partial<InsertDeviceState>): Promise<DeviceState | undefined> {
    // If this is a legacy call with deviceType, handle backward compatibility
    if (typeof id !== 'string' || !id.includes('-')) {
      const deviceType = id;
      const isOn = (updates as any);
      
      const [device] = await db.update(deviceStates)
        .set({ isOn, lastToggled: new Date() })
        .where(eq(deviceStates.deviceType, deviceType))
        .returning();
      
      if (device) return device;

      // Create new device state if it doesn't exist
      const [newDevice] = await db.insert(deviceStates).values({
        deviceType,
        isOn,
        name: `Device ${deviceType}`,
      }).returning();
      return newDevice;
    }

    // Modern update by ID
    const updateData = { ...updates, lastToggled: new Date() };
    const [device] = await db.update(deviceStates)
      .set(updateData)
      .where(eq(deviceStates.id, id))
      .returning();
    return device || undefined;
  }

  async deleteDeviceState(id: string): Promise<boolean> {
    const result = await db.delete(deviceStates).where(eq(deviceStates.id, id));
    return result.rowCount > 0;
  }

  async deleteDeviceStatesByPlant(plantId: string): Promise<boolean> {
    const result = await db.delete(deviceStates).where(eq(deviceStates.plantId, plantId));
    return result.rowCount > 0;
  }

  // Backups
  async getBackups(): Promise<Backup[]> {
    return await db.select().from(backups).orderBy(sql`created_at DESC`);
  }

  async createBackup(insertBackup: InsertBackup): Promise<Backup> {
    const [backup] = await db.insert(backups).values(insertBackup).returning();
    return backup;
  }

  async deleteBackup(id: string): Promise<boolean> {
    const result = await db.delete(backups).where(eq(backups.id, id));
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();
