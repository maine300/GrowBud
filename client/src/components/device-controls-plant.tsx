import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Power, Plus, Settings, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Plant } from "@shared/schema";

interface DeviceControlsPlantProps {
  plantId: string;
  plant: Plant;
}

interface Device {
  id: string;
  plantId?: string;
  deviceGroup?: string;
  deviceType: string;
  name: string;
  isOn: boolean;
  lastToggled: string;
}

export default function DeviceControlsPlant({ plantId, plant }: DeviceControlsPlantProps) {
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [newDeviceType, setNewDeviceType] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newGroupName, setNewGroupName] = useState(plant.deviceGroup || "");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: devices = [] } = useQuery<Device[]>({
    queryKey: ["/api/devices"],
    select: (data) => data.filter((device: Device) => 
      device.plantId === plantId || 
      (device.deviceGroup && device.deviceGroup === plant.deviceGroup)
    ),
  });

  const { data: allPlants = [] } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  const plantsInGroup = allPlants.filter(p => 
    p.deviceGroup && p.deviceGroup === plant.deviceGroup && p.id !== plantId
  );

  const toggleDeviceMutation = useMutation({
    mutationFn: async ({ deviceId, isOn }: { deviceId: string; isOn: boolean }) => {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isOn }),
      });
      if (!response.ok) throw new Error("Failed to toggle device");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
    },
  });

  const addDeviceMutation = useMutation({
    mutationFn: async ({ deviceType, name }: { deviceType: string; name: string }) => {
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantId,
          deviceGroup: plant.deviceGroup,
          deviceType,
          name,
          isOn: false,
        }),
      });
      if (!response.ok) throw new Error("Failed to add device");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      setShowAddDevice(false);
      setNewDeviceType("");
      setNewDeviceName("");
      toast({
        title: "Device added",
        description: "New device has been added successfully.",
      });
    },
  });

  const updatePlantGroupMutation = useMutation({
    mutationFn: async (deviceGroup: string) => {
      const response = await fetch(`/api/plants/${plantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceGroup }),
      });
      if (!response.ok) throw new Error("Failed to update plant group");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plants", plantId] });
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      setShowGroupSettings(false);
      toast({
        title: "Device group updated",
        description: "Plant device group has been updated successfully.",
      });
    },
  });

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "light": return "💡";
      case "fan": return "🌪️";
      case "pump": return "💧";
      case "heater": return "🔥";
      case "humidifier": return "💨";
      default: return "⚡";
    }
  };

  const handleAddDevice = () => {
    if (newDeviceType && newDeviceName) {
      addDeviceMutation.mutate({ deviceType: newDeviceType, name: newDeviceName });
    }
  };

  const handleUpdateGroup = () => {
    updatePlantGroupMutation.mutate(newGroupName);
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-white flex items-center">
            <Power className="w-5 h-5 mr-2" />
            Device Controls
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Dialog open={showGroupSettings} onOpenChange={setShowGroupSettings}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Users className="w-4 h-4 mr-1" />
                  Group
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Device Group Settings</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">
                      Device Group Name (plants in same tent/location)
                    </label>
                    <Input
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      placeholder="e.g., tent-1, greenhouse-a"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  {plantsInGroup.length > 0 && (
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">
                        Plants in this group:
                      </label>
                      <div className="space-y-1">
                        {plantsInGroup.map(p => (
                          <div key={p.id} className="text-sm text-white bg-gray-700 p-2 rounded">
                            {p.name} ({p.location})
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <Button
                    onClick={handleUpdateGroup}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    disabled={updatePlantGroupMutation.isPending}
                  >
                    Update Group
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            <Dialog open={showAddDevice} onOpenChange={setShowAddDevice}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Plus className="w-4 h-4 mr-1" />
                  Add Device
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-800 border-gray-700">
                <DialogHeader>
                  <DialogTitle className="text-white">Add New Device</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Device Type</label>
                    <Select value={newDeviceType} onValueChange={setNewDeviceType}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue placeholder="Select device type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="fan">Fan</SelectItem>
                        <SelectItem value="pump">Water Pump</SelectItem>
                        <SelectItem value="heater">Heater</SelectItem>
                        <SelectItem value="humidifier">Humidifier</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Device Name</label>
                    <Input
                      value={newDeviceName}
                      onChange={(e) => setNewDeviceName(e.target.value)}
                      placeholder="e.g., Main LED, Exhaust Fan"
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <Button
                    onClick={handleAddDevice}
                    disabled={!newDeviceType || !newDeviceName || addDeviceMutation.isPending}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    Add Device
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        
        {plant.deviceGroup && (
          <div className="text-sm text-gray-400">
            Group: <span className="text-white">{plant.deviceGroup}</span>
            {plantsInGroup.length > 0 && (
              <span className="ml-2">({plantsInGroup.length + 1} plants)</span>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent>
        {devices.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            <Power className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="mb-4">No devices configured</p>
            <Button
              variant="outline"
              onClick={() => setShowAddDevice(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Device
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {devices.map((device) => (
              <div
                key={device.id}
                className="bg-gray-700 rounded-lg p-4 flex items-center justify-between"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getDeviceIcon(device.deviceType)}</span>
                  <div>
                    <h4 className="text-white font-medium">{device.name}</h4>
                    <p className="text-gray-400 text-sm capitalize">{device.deviceType}</p>
                    {device.deviceGroup && device.plantId !== plantId && (
                      <p className="text-blue-400 text-xs">Shared device</p>
                    )}
                  </div>
                </div>
                <Switch
                  checked={device.isOn}
                  onCheckedChange={(isOn) =>
                    toggleDeviceMutation.mutate({ deviceId: device.id, isOn })
                  }
                  className="data-[state=checked]:bg-green-600"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}