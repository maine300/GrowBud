import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Droplets, Sprout } from "lucide-react";
import type { Plant } from "@shared/schema";

interface SensorDataPlantProps {
  plantId: string;
  plant: Plant;
}

interface SensorReading {
  id: string;
  plantId?: string;
  deviceGroup?: string;
  temperature: number;
  humidity: number;
  soilMoisture: number;
  recordedAt: string;
}

export default function SensorDataPlant({ plantId, plant }: SensorDataPlantProps) {
  const { data: allSensorData } = useQuery<SensorReading[]>({
    queryKey: ["/api/sensor-data"],
  });

  // Get sensor data for this plant or its device group
  const sensorData = allSensorData?.find((data: SensorReading) => 
    data.plantId === plantId || 
    (data.deviceGroup && data.deviceGroup === plant.deviceGroup)
  );

  const getStatusColor = (value: number, type: string) => {
    switch (type) {
      case "temperature":
        if (value >= 20 && value <= 26) return "text-green-400";
        if (value >= 18 && value <= 30) return "text-yellow-400";
        return "text-red-400";
      case "humidity":
        if (value >= 40 && value <= 60) return "text-green-400";
        if (value >= 30 && value <= 70) return "text-yellow-400";
        return "text-red-400";
      case "soilMoisture":
        if (value >= 60 && value <= 80) return "text-green-400";
        if (value >= 40 && value <= 85) return "text-yellow-400";
        return "text-red-400";
      default:
        return "text-gray-400";
    }
  };

  const getStatusText = (value: number, type: string) => {
    switch (type) {
      case "temperature":
        if (value >= 20 && value <= 26) return "Optimal";
        if (value >= 18 && value <= 30) return "Good";
        return value < 18 ? "Too Cold" : "Too Hot";
      case "humidity":
        if (value >= 40 && value <= 60) return "Optimal";
        if (value >= 30 && value <= 70) return "Good";
        return value < 40 ? "Too Dry" : "Too Humid";
      case "soilMoisture":
        if (value >= 60 && value <= 80) return "Optimal";
        if (value >= 40 && value <= 85) return "Good";
        return value < 40 ? "Too Dry" : "Too Wet";
      default:
        return "Unknown";
    }
  };

  if (!sensorData) {
    return (
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center">
            <Thermometer className="w-5 h-5 mr-2" />
            Environmental Sensors
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-gray-400 py-8">
            <Thermometer className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No sensor data available</p>
            <p className="text-sm mt-2">
              {plant.deviceGroup 
                ? `Configure sensors for group: ${plant.deviceGroup}`
                : "Add this plant to a device group or configure individual sensors"
              }
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white flex items-center">
          <Thermometer className="w-5 h-5 mr-2" />
          Environmental Sensors
        </CardTitle>
        {sensorData.deviceGroup && sensorData.plantId !== plantId && (
          <p className="text-sm text-blue-400">Shared sensors (Group: {sensorData.deviceGroup})</p>
        )}
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Thermometer className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300 text-sm">Temperature</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {sensorData.temperature}°C
            </div>
            <div className={`text-sm ${getStatusColor(sensorData.temperature, "temperature")}`}>
              {getStatusText(sensorData.temperature, "temperature")}
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Droplets className="w-5 h-5 text-blue-400" />
                <span className="text-gray-300 text-sm">Humidity</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {sensorData.humidity}%
            </div>
            <div className={`text-sm ${getStatusColor(sensorData.humidity, "humidity")}`}>
              {getStatusText(sensorData.humidity, "humidity")}
            </div>
          </div>

          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <Sprout className="w-5 h-5 text-green-400" />
                <span className="text-gray-300 text-sm">Soil Moisture</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-white mb-1">
              {sensorData.soilMoisture}%
            </div>
            <div className={`text-sm ${getStatusColor(sensorData.soilMoisture, "soilMoisture")}`}>
              {getStatusText(sensorData.soilMoisture, "soilMoisture")}
            </div>
          </div>
        </div>

        <div className="mt-4 text-xs text-gray-400 text-center">
          Last updated: {new Date(sensorData.recordedAt).toLocaleString()}
        </div>
      </CardContent>
    </Card>
  );
}