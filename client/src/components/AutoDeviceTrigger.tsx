import { useEffect } from "react";
import {
  getFanAutomation,
  getLightAutomation,
  getPumpAutomation,
} from "@/lib/automationLogic";
import type { Plant } from "@shared/schema";

interface SensorData {
  temperature: number;
  humidity: number;
  soilMoisture: number;
}

interface Device {
  id: string;
  name: string;
  type: "light" | "pump" | "fan";
  smartMode: boolean;
  manualMode: boolean;
}

interface AutoDeviceTriggerProps {
  plant: Plant;
  sensorData: SensorData;
  devices: Device[];
}

export default function AutoDeviceTrigger({
  plant,
  sensorData,
  devices,
}: AutoDeviceTriggerProps) {
  useEffect(() => {
    if (!devices || !sensorData || !plant) return;

    const controlDevice = async (deviceId: string, state: boolean) => {
      try {
        await fetch(`/api/devices/${deviceId}/${state ? "on" : "off"}`, {
          method: "POST",
        });
      } catch (err) {
        console.error(`Failed to control device ${deviceId}:`, err);
      }
    };

    devices.forEach((device) => {
      if (device.smartMode) {
        let shouldTurnOn = false;

        if (device.type === "pump") {
          shouldTurnOn = getPumpAutomation(plant, sensorData);
        } else if (device.type === "light") {
          shouldTurnOn = getLightAutomation(plant, sensorData);
        } else if (device.type === "fan") {
          shouldTurnOn = getFanAutomation(plant, sensorData);
        }

        controlDevice(device.id, shouldTurnOn);
      }
    });
  }, [devices, sensorData, plant]);

  return null; // background automation only
}
