import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { SensorData, DeviceState } from "@shared/schema";

export default function SystemStatus() {
  const { data: sensorData, dataUpdatedAt: sensorUpdatedAt } = useQuery<SensorData>({
    queryKey: ["/api/sensor-data"],
    refetchInterval: 5000,
  });

  const { data: devices = [] } = useQuery<DeviceState[]>({
    queryKey: ["/api/devices"],
  });

  const getTimeSinceUpdate = (timestamp: number) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds} seconds ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minutes ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours} hours ago`;
  };

  const activeDevices = devices.filter(device => device.isOn).length;
  const systemOnline = sensorData !== undefined;
  const sensorsActive = sensorData !== undefined && sensorUpdatedAt > Date.now() - 60000; // Updated within 1 minute

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${systemOnline ? 'bg-plant-green-500' : 'bg-red-500'}`}></div>
              <span className="text-gray-400 text-sm">
                System {systemOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className={`w-3 h-3 rounded-full ${sensorsActive ? 'bg-plant-green-500' : 'bg-amber-500'}`}></div>
              <span className="text-gray-400 text-sm">
                Sensors {sensorsActive ? 'Active' : 'Warning'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span className="text-gray-400 text-sm">
                Cloud Connected
              </span>
            </div>

            <div className="flex items-center space-x-2">
              <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                {activeDevices}/{devices.length} Devices Active
              </Badge>
            </div>
          </div>
          
          <div className="text-gray-400 text-sm">
            Last updated: {sensorUpdatedAt ? getTimeSinceUpdate(sensorUpdatedAt) : 'Never'}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
