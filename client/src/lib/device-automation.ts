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
 * Calculate recommended light distance based on wattage and plant stage
 */
export function calculateLightDistance(wattage: number, stage: string): { distance: number; reason: string } {
  const baseDistances = {
    seed: { low: 60, med: 45, high: 30 }, // cm
    vegetative: { low: 45, med: 30, high: 20 },
    flowering: { low: 30, med: 20, high: 15 },
  };

  const stageKey = stage.toLowerCase() as keyof typeof baseDistances;
  const distances = baseDistances[stageKey] || baseDistances.vegetative;

  let category: keyof typeof distances;
  let distance: number;

  if (wattage <= 100) {
    category = "low";
    distance = distances.low;
  } else if (wattage <= 300) {
    category = "med";
    distance = distances.med;
  } else {
    category = "high";
    distance = distances.high;
  }

  return {
    distance,
    reason: `${wattage}W light in ${stage} stage: ${category} intensity setup`
  };
}

/**
 * Calculate recommended intensity for dimmable lights
 */
export function calculateRecommendedIntensity(
  wattage: number, 
  distance: number, 
  stage: string,
  isDimmable: boolean = true
): { intensity: number; reason: string; ppfd: number } {
  if (!isDimmable) {
    return {
      intensity: 100,
      reason: "Non-dimmable light at full power",
      ppfd: 0
    };
  }

  // Professional intensity recommendations table
  const intensityTable: Record<number, Record<number, Record<string, number[]>>> = {
    100: {
      12: { seedling: [20, 30], vegetative: [50, 60], flowering: [80, 100] },
      18: { seedling: [30, 40], vegetative: [60, 70], flowering: [100, 100] }
    },
    200: {
      12: { seedling: [15, 25], vegetative: [40, 50], flowering: [70, 90] },
      18: { seedling: [25, 35], vegetative: [60, 60], flowering: [100, 100] }
    },
    300: {
      12: { seedling: [10, 20], vegetative: [30, 40], flowering: [60, 80] },
      18: { seedling: [20, 30], vegetative: [50, 60], flowering: [100, 100] }
    },
    400: {
      12: { seedling: [10, 15], vegetative: [25, 35], flowering: [50, 75] },
      18: { seedling: [20, 30], vegetative: [40, 60], flowering: [80, 100] },
      24: { seedling: [20, 30], vegetative: [40, 60], flowering: [80, 100] }
    },
    600: {
      18: { seedling: [10, 10], vegetative: [30, 40], flowering: [60, 80] },
      24: { seedling: [15, 25], vegetative: [50, 50], flowering: [100, 100] }
    },
    800: {
      24: { seedling: [10, 20], vegetative: [30, 50], flowering: [70, 90] }
    },
    1000: {
      24: { seedling: [10, 15], vegetative: [25, 40], flowering: [60, 90] },
      30: { seedling: [15, 25], vegetative: [50, 60], flowering: [100, 100] }
    }
  };

  // Convert distance from cm to inches for lookup
  const distanceInches = Math.round(distance / 2.54);
  
  // Find closest wattage match
  const wattages = Object.keys(intensityTable).map(Number).sort((a, b) => a - b);
  const closestWattage = wattages.reduce((prev, curr) => 
    Math.abs(curr - wattage) < Math.abs(prev - wattage) ? curr : prev
  );

  // Find closest distance match
  const distances = Object.keys(intensityTable[closestWattage as keyof typeof intensityTable]).map(Number);
  const closestDistance = distances.reduce((prev, curr) => 
    Math.abs(curr - distanceInches) < Math.abs(prev - distanceInches) ? curr : prev
  );

  // Get stage recommendations
  const stageKey = stage.toLowerCase() === 'seed' ? 'seedling' : 
                  stage.toLowerCase() === 'vegetative' ? 'vegetative' : 'flowering';

  const wattageData = intensityTable[closestWattage];
  if (!wattageData) {
    return {
      intensity: 50,
      reason: `No data available for ${wattage}W`,
      ppfd: 0
    };
  }
  
  const distanceData = wattageData[closestDistance];
  if (!distanceData) {
    return {
      intensity: 50,
      reason: `No data available for ${distance}cm distance`,
      ppfd: 0
    };
  }
  
  const stageRec = distanceData[stageKey];
  
  if (!stageRec) {
    return {
      intensity: 50,
      reason: `No specific recommendation for ${wattage}W at ${distance}cm`,
      ppfd: 0
    };
  }

  // Use middle of range for recommendation
  const intensity = Math.round((stageRec[0] + stageRec[1]) / 2);
  
  // Calculate approximate PPFD (rough estimation)
  const efficiency = 2.5; // μmol/J for quality LEDs
  const maxPPFD = (wattage * efficiency * 1000000) / (distance * distance * Math.PI);
  const actualPPFD = (maxPPFD * intensity) / 100;

  let reason = `${intensity}% (${stageRec[0]}–${stageRec[1]}%) for ${wattage}W at ${Math.round(distanceInches)}" in ${stage} stage`;
  
  if (closestWattage !== wattage) {
    reason += ` (based on ${closestWattage}W)`;
  }

  return {
    intensity,
    reason,
    ppfd: Math.round(actualPPFD)
  };
}

/**
 * Get light schedule based on plant stage
 */
export function getLightSchedule(stage: string): { hoursOn: number; reason: string } {
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
  sensorData?: SensorReading
): AutomationRecommendation {
  const schedule = getLightSchedule(plant.stage);
  const currentHour = new Date().getHours();
  
  // Simple day/night cycle - lights on from 6 AM to 6 AM + schedule hours
  const lightStartHour = 6;
  const lightEndHour = (lightStartHour + schedule.hoursOn) % 24;
  
  const shouldBeOn = lightStartHour <= lightEndHour
    ? currentHour >= lightStartHour && currentHour < lightEndHour
    : currentHour >= lightStartHour || currentHour < lightEndHour;

  let recommendation = "";
  if (device.wattage) {
    const distanceRec = calculateLightDistance(device.wattage, plant.stage);
    recommendation = `Recommended distance: ${distanceRec.distance}cm. ${distanceRec.reason}`;
  }

  return {
    shouldBeOn,
    reason: `${schedule.reason}. Currently ${shouldBeOn ? 'day' : 'night'} period.`,
    recommendation
  };
}

/**
 * Fan automation logic
 */
export function getFanAutomation(
  plant: Plant,
  device: DeviceState,
  sensorData?: SensorReading
): AutomationRecommendation {
  if (!sensorData) {
    return {
      shouldBeOn: false,
      reason: "No sensor data available"
    };
  }

  const idealTemp = plant.stage === "flowering" ? 24 : 26; // °C
  const idealHumidity = plant.stage === "flowering" ? 50 : 60; // %
  
  const tempHigh = sensorData.temperature > idealTemp + 2;
  const humidityHigh = sensorData.humidity > idealHumidity + 10;
  
  const shouldBeOn = tempHigh || humidityHigh;
  
  const reasons = [];
  if (tempHigh) reasons.push(`temp ${sensorData.temperature}°C > ${idealTemp + 2}°C`);
  if (humidityHigh) reasons.push(`humidity ${sensorData.humidity}% > ${idealHumidity + 10}%`);
  
  return {
    shouldBeOn,
    reason: shouldBeOn 
      ? `Ventilation needed: ${reasons.join(', ')}`
      : `Conditions good: ${sensorData.temperature}°C, ${sensorData.humidity}%`
  };
}

/**
 * Pump automation logic
 */
export function getPumpAutomation(
  plant: Plant,
  device: DeviceState,
  sensorData?: SensorReading
): AutomationRecommendation {
  if (!sensorData) {
    return {
      shouldBeOn: false,
      reason: "No sensor data available"
    };
  }

  // Soil moisture thresholds based on stage
  const thresholds = {
    seed: { dry: 400, moist: 500 }, // Higher moisture for seeds
    vegetative: { dry: 300, moist: 450 }, // Moderate for veg
    flowering: { dry: 250, moist: 400 }, // Lower for flowering
  };

  const stageKey = plant.stage.toLowerCase() as keyof typeof thresholds;
  const threshold = thresholds[stageKey] || thresholds.vegetative;
  
  const shouldBeOn = sensorData.soilMoisture < threshold.dry;
  
  return {
    shouldBeOn,
    reason: shouldBeOn
      ? `Soil dry: ${sensorData.soilMoisture} < ${threshold.dry} (${plant.stage} stage)`
      : `Soil moisture good: ${sensorData.soilMoisture} (target: ${threshold.dry}-${threshold.moist})`,
    recommendation: `Optimal range for ${plant.stage}: ${threshold.dry}-${threshold.moist}`
  };
}

/**
 * Get automation recommendation for any device type
 */
export function getDeviceAutomation(
  device: DeviceState,
  plant: Plant,
  sensorData?: SensorReading
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
          ? `Temperature ${sensorData.temperature}°C ${sensorData.temperature < 20 ? '< 20°C' : '>= 20°C'}`
          : "No sensor data available"
      };
    case "humidifier":
      return {
        shouldBeOn: sensorData ? sensorData.humidity < 40 : false,
        reason: sensorData
          ? `Humidity ${sensorData.humidity}% ${sensorData.humidity < 40 ? '< 40%' : '>= 40%'}`
          : "No sensor data available"
      };
    default:
      return {
        shouldBeOn: false,
        reason: "Unknown device type"
      };
  }
}