import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Lightbulb, Fan, Droplets } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { DeviceState } from "@shared/schema";

interface ControlPanelProps {
  devices: DeviceState[];
}

export default function ControlPanel({ devices }: ControlPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const toggleDeviceMutation = useMutation({
    mutationFn: async (deviceType: string) => {
      const response = await fetch(`/api/devices/${deviceType}/toggle`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to toggle device");
      return response.json();
    },
    onSuccess: (data, deviceType) => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({
        title: "Device Updated",
        description: `${deviceType} has been ${data.isOn ? "turned on" : "turned off"}.`,
      });
    },
    onError: (error, deviceType) => {
      toast({
        title: "Error",
        description: `Failed to toggle ${deviceType}.`,
        variant: "destructive",
      });
    },
  });

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case "light":
        return Lightbulb;
      case "fan":
        return Fan;
      case "pump":
        return Droplets;
      default:
        return Lightbulb;
    }
  };

  const getDeviceColor = (deviceType: string) => {
    switch (deviceType) {
      case "light":
        return "bg-yellow-600";
      case "fan":
        return "bg-blue-600";
      case "pump":
        return "bg-cyan-600";
      default:
        return "bg-gray-600";
    }
  };

  const getDeviceDescription = (deviceType: string, isOn: boolean) => {
    switch (deviceType) {
      case "light":
        return isOn ? "18/6 cycle active" : "Light off";
      case "fan":
        return isOn ? "Auto mode enabled" : "Fan off";
      case "pump":
        return isOn ? "Pumping water" : "Manual control";
      default:
        return isOn ? "Active" : "Inactive";
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white">Device Controls</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {devices.map((device) => {
            const IconComponent = getDeviceIcon(device.deviceType);
            const deviceColor = getDeviceColor(device.deviceType);
            const description = getDeviceDescription(device.deviceType, device.isOn);

            return (
              <div
                key={device.id}
                className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 ${deviceColor} rounded-lg flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-medium capitalize">
                      {device.deviceType === "pump" ? "Water Pump" : 
                       device.deviceType === "fan" ? "Ventilation Fan" : 
                       device.deviceType === "light" ? "Grow Light" : device.deviceType}
                    </p>
                    <p className="text-gray-400 text-sm">{description}</p>
                  </div>
                </div>
                <Button
                  className={`${
                    device.isOn 
                      ? "bg-plant-green-600 hover:bg-plant-green-700" 
                      : "bg-gray-600 hover:bg-gray-500"
                  } text-white transition-colors duration-200`}
                  onClick={() => toggleDeviceMutation.mutate(device.deviceType)}
                  disabled={toggleDeviceMutation.isPending}
                >
                  {device.isOn ? "Turn Off" : "Turn On"}
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
