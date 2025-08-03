import { getDeviceAutomation } from "@/lib/automationLogic";

import type { Plant, DeviceState } from "@shared/schema";

interface SensorReading {
  temperature: number;
  humidity: number;
  soilMoisture: number;
}

interface AutomationRecommendation {
  shouldBeOn: boolean;
  reason: string;
  recommendation?: string;
}

/**
 * Get light schedule based on plant stage
 */
export function getLightSchedule(stage: string): {
  hoursOn: number;
  reason: string;
} {
  const schedules = {
    seed: { hoursOn: 16, reason: "16/8 cycle for seed development" },
    seedling: { hoursOn: 18, reason: "18/6 cycle for seedling development" },
    vegetative: { hoursOn: 18, reason: "18/6 cycle for vegetative growth" },
    flowering: { hoursOn: 12, reason: "12/12 cycle to trigger flowering" },
    harvest: { hoursOn: 0, reason: "No lighting needed during harvest" },
  };

  const stageKey = stage.toLowerCase() as keyof typeof schedules;
  return schedules[stageKey] || schedules.vegetative;
}

/**
 * Light automation logic
 */
export function getLightAutomation(
  plant: Plant,
  device: DeviceState,
  sensorData?: SensorReading,
): AutomationRecommendation {
  const schedule = getLightSchedule(plant.stage);
  const currentHour = new Date().getHours();

  const lightStartHour = 6;
  const lightEndHour = (lightStartHour + schedule.hoursOn) % 24;

  const shouldBeOn =
    lightStartHour <= lightEndHour
      ? currentHour >= lightStartHour && currentHour < lightEndHour
      : currentHour >= lightStartHour || currentHour < lightEndHour;

  return {
    shouldBeOn,
    reason: `${schedule.reason}. Currently ${shouldBeOn ? "day" : "night"} period.`,
  };
}

/**
 * Fan automation logic
 */
export function getFanAutomation(
  plant: Plant,
  device: DeviceState,
  sensorData?: SensorReading,
): AutomationRecommendation {
  if (!sensorData) {
    return {
      shouldBeOn: false,
      reason: "No sensor data available",
    };
  }

  const idealTemp = plant.stage === "flowering" ? 24 : 26;
  const idealHumidity = plant.stage === "flowering" ? 50 : 60;

  const tempHigh = sensorData.temperature > idealTemp + 2;
  const humidityHigh = sensorData.humidity > idealHumidity + 10;

  const shouldBeOn = tempHigh || humidityHigh;

  const reasons = [];
  if (tempHigh)
    reasons.push(`temp ${sensorData.temperature}°C > ${idealTemp + 2}°C`);
  if (humidityHigh)
    reasons.push(`humidity ${sensorData.humidity}% > ${idealHumidity + 10}%`);

  return {
    shouldBeOn,
    reason: shouldBeOn
      ? `Ventilation needed: ${reasons.join(", ")}`
      : `Conditions good: ${sensorData.temperature}°C, ${sensorData.humidity}%`,
  };
}

/**
 * Pump automation logic
 */
export function getPumpAutomation(
  plant: Plant,
  device: DeviceState,
  sensorData?: SensorReading,
): AutomationRecommendation {
  if (!sensorData) {
    return {
      shouldBeOn: false,
      reason: "No sensor data available",
    };
  }

  const thresholds = {
    seed: { dry: 400, moist: 500 },
    vegetative: { dry: 300, moist: 450 },
    flowering: { dry: 250, moist: 400 },
  };

  const stageKey = plant.stage.toLowerCase() as keyof typeof thresholds;
  const threshold = thresholds[stageKey] || thresholds.vegetative;

  const shouldBeOn = sensorData.soilMoisture < threshold.dry;

  return {
    shouldBeOn,
    reason: shouldBeOn
      ? `Soil dry: ${sensorData.soilMoisture} < ${threshold.dry} (${plant.stage} stage)`
      : `Soil moisture good: ${sensorData.soilMoisture} (target: ${threshold.dry}-${threshold.moist})`,
    recommendation: `Optimal range for ${plant.stage}: ${threshold.dry}-${threshold.moist}`,
  };
}

/**
 * Get automation recommendation for any device type
 */
export function getDeviceAutomation(
  device: DeviceState,
  plant: Plant,
  sensorData?: SensorReading,
): AutomationRecommendation {
  switch (device.deviceType) {
    case "light":
      return getLightAutomation(plant, device, sensorData);
    case "fan":
      return getFanAutomation(plant, device, sensorData);
    case "pump":
      return getPumpAutomation(plant, device, sensorData);
    case "heater":
      return {
        shouldBeOn: sensorData ? sensorData.temperature < 20 : false,
        reason: sensorData
          ? `Temperature ${sensorData.temperature}°C ${sensorData.temperature < 20 ? "< 20°C" : ">= 20°C"}`
          : "No sensor data available",
      };
    case "humidifier":
      return {
        shouldBeOn: sensorData ? sensorData.humidity < 40 : false,
        reason: sensorData
          ? `Humidity ${sensorData.humidity}% ${sensorData.humidity < 40 ? "< 40%" : ">= 40%"}`
          : "No sensor data available",
      };
    default:
      return {
        shouldBeOn: false,
        reason: "Unknown device type",
      };
  }
}
