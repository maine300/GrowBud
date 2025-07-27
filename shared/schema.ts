import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const plants = pgTable("plants", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  strainType: text("strain_type").notNull(),
  location: text("location").notNull(),
  stage: text("stage").notNull(),
  plantedDate: timestamp("planted_date").notNull().defaultNow(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const photos = pgTable("photos", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plantId: varchar("plant_id").notNull().references(() => plants.id),
  filename: text("filename").notNull(),
  path: text("path").notNull(),
  capturedAt: timestamp("captured_at").notNull().defaultNow(),
});

export const sensorData = pgTable("sensor_data", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  temperature: integer("temperature").notNull(),
  humidity: integer("humidity").notNull(),
  soilMoisture: integer("soil_moisture").notNull(),
  recordedAt: timestamp("recorded_at").notNull().defaultNow(),
});

export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  plantId: varchar("plant_id").notNull().references(() => plants.id),
  date: text("date").notNull(), // YYYY-MM-DD format
  task: text("task").notNull(),
  completed: boolean("completed").notNull().default(false),
  stage: text("stage").notNull().default("vegetative"), // seed, seedling, vegetative, flowering, harvest
  potSize: text("pot_size"), // small, medium, large
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const feedingSchedules = pgTable("feeding_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  stage: text("stage").notNull(), // seed, seedling, vegetative, flowering, harvest
  potSize: text("pot_size").notNull(), // small, medium, large
  scheduleData: jsonb("schedule_data").notNull(), // Array of {week: number, task: string, nutrients?: string}
  uploadedBy: text("uploaded_by").default("user"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const deviceStates = pgTable("device_states", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  deviceType: text("device_type").notNull(), // light, fan, pump
  isOn: boolean("is_on").notNull().default(false),
  lastToggled: timestamp("last_toggled").notNull().defaultNow(),
});

export const backups = pgTable("backups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  size: integer("size").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Insert schemas
export const insertPlantSchema = createInsertSchema(plants).omit({
  id: true,
  createdAt: true,
});

export const insertPhotoSchema = createInsertSchema(photos).omit({
  id: true,
  capturedAt: true,
});

export const insertSensorDataSchema = createInsertSchema(sensorData).omit({
  id: true,
  recordedAt: true,
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export const insertFeedingScheduleSchema = createInsertSchema(feedingSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertDeviceStateSchema = createInsertSchema(deviceStates).omit({
  id: true,
  lastToggled: true,
});

export const insertBackupSchema = createInsertSchema(backups).omit({
  id: true,
  createdAt: true,
});

// Types
export type Plant = typeof plants.$inferSelect;
export type InsertPlant = z.infer<typeof insertPlantSchema>;
export type Photo = typeof photos.$inferSelect;
export type InsertPhoto = z.infer<typeof insertPhotoSchema>;
export type SensorData = typeof sensorData.$inferSelect;
export type InsertSensorData = z.infer<typeof insertSensorDataSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;
export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type FeedingSchedule = typeof feedingSchedules.$inferSelect;
export type InsertFeedingSchedule = z.infer<typeof insertFeedingScheduleSchema>;
export type DeviceState = typeof deviceStates.$inferSelect;
export type InsertDeviceState = z.infer<typeof insertDeviceStateSchema>;
export type Backup = typeof backups.$inferSelect;
export type InsertBackup = z.infer<typeof insertBackupSchema>;
