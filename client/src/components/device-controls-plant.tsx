import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Power, Plus, Settings, Users, Zap, Lightbulb, Info } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getDeviceAutomation, calculateLightDistance, calculateRecommendedIntensity } from "@/lib/device-automation";
import type { Plant } from "@shared/schema";

interface DeviceControlsPlantProps {
  plantId: string;
  plant: Plant;
}

interface Device {
  id: string;
  plantId: string | null;
  deviceGroup: string | null;
  deviceType: string;
  name: string;
  isOn: boolean;
  autoMode: boolean;
  wattage: number | null;
  distanceFromPlant: number | null;
  isDimmable?: boolean;
  currentIntensity?: number;
  lastToggled: Date;
}

export default function DeviceControlsPlant({ plantId, plant }: DeviceControlsPlantProps) {
  const [showAddDevice, setShowAddDevice] = useState(false);
  const [showGroupSettings, setShowGroupSettings] = useState(false);
  const [showDeviceSettings, setShowDeviceSettings] = useState<string | null>(null);
  const [newDeviceType, setNewDeviceType] = useState("");
  const [newDeviceName, setNewDeviceName] = useState("");
  const [newWattage, setNewWattage] = useState("");
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

  const { data: sensorDataArray = [] } = useQuery<any[]>({
    queryKey: ["/api/sensor-data"],
  });

  const sensorData = sensorDataArray.find((data: any) => 
    data.plantId === plantId || 
    (data.deviceGroup && data.deviceGroup === plant.deviceGroup)
  ) || sensorDataArray[0];

  const plantsInGroup = allPlants.filter(p => 
    p.deviceGroup && p.deviceGroup === plant.deviceGroup && p.id !== plantId
  );

  const toggleDeviceMutation = useMutation({
    mutationFn: async ({ deviceId, isOn, autoMode }: { deviceId: string; isOn?: boolean; autoMode?: boolean }) => {
      const updateData: any = {};
      if (isOn !== undefined) updateData.isOn = isOn;
      if (autoMode !== undefined) updateData.autoMode = autoMode;
      
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error("Failed to update device");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      toast({
        title: "Device Updated",
        description: "Device state has been updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update device.",
        variant: "destructive",
      });
    },
  });

  const addDeviceMutation = useMutation({
    mutationFn: async ({ deviceType, name, wattage }: { deviceType: string; name: string; wattage?: number }) => {
      const deviceData: any = {
        plantId,
        deviceGroup: plant.deviceGroup,
        deviceType,
        name,
        isOn: false,
        autoMode: false,
      };
      if (wattage) deviceData.wattage = wattage;
      
      const response = await fetch("/api/devices", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(deviceData),
      });
      if (!response.ok) throw new Error("Failed to add device");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      setShowAddDevice(false);
      setNewDeviceType("");
      setNewDeviceName("");
      setNewWattage("");
      toast({
        title: "Device added",
        description: "New device has been added successfully.",
      });
    },
  });

  const updateDeviceSettingsMutation = useMutation({
    mutationFn: async ({ deviceId, wattage, distanceFromPlant, isDimmable, currentIntensity }: { 
      deviceId: string; 
      wattage?: number; 
      distanceFromPlant?: number;
      isDimmable?: boolean;
      currentIntensity?: number;
    }) => {
      const updateData: any = {};
      if (wattage !== undefined) updateData.wattage = wattage;
      if (distanceFromPlant !== undefined) updateData.distanceFromPlant = distanceFromPlant;
      if (isDimmable !== undefined) updateData.isDimmable = isDimmable;
      if (currentIntensity !== undefined) updateData.currentIntensity = currentIntensity;
      
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      if (!response.ok) throw new Error("Failed to update device settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/devices"] });
      setShowDeviceSettings(null);
      toast({
        title: "Settings Updated",
        description: "Device settings have been updated.",
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
      const wattage = newWattage ? parseInt(newWattage) : undefined;
      addDeviceMutation.mutate({ 
        deviceType: newDeviceType, 
        name: newDeviceName,
        wattage 
      });
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
                  
                  {newDeviceType === "light" && (
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Wattage (Optional)</label>
                      <Input
                        type="number"
                        value={newWattage}
                        onChange={(e) => setNewWattage(e.target.value)}
                        placeholder="e.g., 150, 300, 600"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Used to calculate recommended distance from plant
                      </p>
                    </div>
                  )}
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
          <div className="space-y-4">
            {devices.map((device) => {
              const automation = getDeviceAutomation(device as any, plant, sensorData);
              const distanceRec = device.deviceType === "light" && device.wattage 
                ? calculateLightDistance(device.wattage, plant.stage)
                : null;
              const intensityRec = device.deviceType === "light" && device.wattage && device.distanceFromPlant
                ? calculateRecommendedIntensity(device.wattage, device.distanceFromPlant, plant.stage, device.isDimmable)
                : null;
              
              return (
                <div key={device.id} className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getDeviceIcon(device.deviceType)}</span>
                      <div>
                        <h4 className="text-white font-medium flex items-center gap-2">
                          {device.name}
                          {device.wattage && (
                            <Badge variant="secondary" className="text-xs">
                              {device.wattage}W
                            </Badge>
                          )}
                        </h4>
                        <p className="text-gray-400 text-sm capitalize">{device.deviceType}</p>
                        {device.deviceGroup && device.plantId !== plantId && (
                          <p className="text-blue-400 text-xs">Shared device</p>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      {device.deviceType === "light" && (
                        <Dialog open={showDeviceSettings === device.id} onOpenChange={(open) => setShowDeviceSettings(open ? device.id : null)}>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <Settings className="w-4 h-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="bg-gray-800 border-gray-700">
                            <DialogHeader>
                              <DialogTitle className="text-white">Light Settings - {device.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4 mt-4">
                              <div>
                                <Label className="text-sm text-gray-400">Wattage</Label>
                                <Input
                                  type="number"
                                  defaultValue={device.wattage || ""}
                                  onBlur={(e) => {
                                    const wattage = parseInt(e.target.value);
                                    if (wattage && wattage !== device.wattage) {
                                      updateDeviceSettingsMutation.mutate({ deviceId: device.id, wattage });
                                    }
                                  }}
                                  className="bg-gray-700 border-gray-600 text-white"
                                />
                              </div>
                              <div>
                                <Label className="text-sm text-gray-400">Distance from Plant (cm)</Label>
                                <Input
                                  type="number"
                                  defaultValue={device.distanceFromPlant || ""}
                                  onBlur={(e) => {
                                    const distance = parseInt(e.target.value);
                                    if (distance && distance !== device.distanceFromPlant) {
                                      updateDeviceSettingsMutation.mutate({ deviceId: device.id, distanceFromPlant: distance });
                                    }
                                  }}
                                  className="bg-gray-700 border-gray-600 text-white"
                                />
                              </div>
                              
                              <div className="flex items-center space-x-2">
                                <Switch
                                  checked={device.isDimmable || false}
                                  onCheckedChange={(isDimmable) => {
                                    updateDeviceSettingsMutation.mutate({ deviceId: device.id, isDimmable });
                                  }}
                                  className="data-[state=checked]:bg-blue-600"
                                />
                                <Label className="text-sm text-gray-400">Dimmable Light</Label>
                              </div>
                              
                              {device.isDimmable && (
                                <div>
                                  <Label className="text-sm text-gray-400">Current Intensity (%)</Label>
                                  <Input
                                    type="number"
                                    min="10"
                                    max="100"
                                    defaultValue={device.currentIntensity || intensityRec?.intensity || 100}
                                    onBlur={(e) => {
                                      const intensity = parseInt(e.target.value);
                                      if (intensity && intensity !== device.currentIntensity) {
                                        updateDeviceSettingsMutation.mutate({ deviceId: device.id, currentIntensity: intensity });
                                      }
                                    }}
                                    className="bg-gray-700 border-gray-600 text-white"
                                  />
                                  <p className="text-xs text-gray-500 mt-1">
                                    Range: 10-100%. {intensityRec && `Recommended: ${intensityRec.intensity}%`}
                                  </p>
                                </div>
                              )}
                              {distanceRec && (
                                <div className="bg-blue-900/20 border border-blue-700 rounded p-3">
                                  <div className="flex items-center gap-2 text-blue-400 text-sm">
                                    <Info className="w-4 h-4" />
                                    Recommended: {distanceRec.distance}cm
                                  </div>
                                  <p className="text-xs text-gray-400 mt-1">{distanceRec.reason}</p>
                                </div>
                              )}
                              
                              {/* Show intensity recommendation if both wattage and distance are set */}
                              {device.wattage && device.distanceFromPlant && (
                                <div className="bg-green-900/20 border border-green-700 rounded p-3">
                                  <div className="flex items-center justify-between text-green-400 text-sm mb-1">
                                    <div className="flex items-center gap-2">
                                      <Zap className="w-4 h-4" />
                                      Recommended Intensity
                                    </div>
                                    <Badge variant="outline" className="text-green-400 border-green-400">
                                      {intensityRec?.intensity}%
                                    </Badge>
                                  </div>
                                  <p className="text-xs text-gray-400 mb-1">{intensityRec?.reason}</p>
                                  <p className="text-xs text-green-300">
                                    PPFD: {intensityRec?.ppfd} μmol/m²/s
                                  </p>
                                </div>
                              )}
                            </div>
                          </DialogContent>
                        </Dialog>
                      )}
                      
                      <div className="flex flex-col items-center space-y-1">
                        <Switch
                          checked={device.isOn}
                          onCheckedChange={(isOn) =>
                            toggleDeviceMutation.mutate({ deviceId: device.id, isOn, autoMode: false })
                          }
                          className="data-[state=checked]:bg-green-600"
                          disabled={device.autoMode}
                        />
                        <span className="text-xs text-gray-400">Manual</span>
                      </div>
                      
                      <div className="flex flex-col items-center space-y-1">
                        <Switch
                          checked={device.autoMode}
                          onCheckedChange={(autoMode) => {
                            const isOn = autoMode ? automation.shouldBeOn : device.isOn;
                            toggleDeviceMutation.mutate({ deviceId: device.id, autoMode, isOn });
                          }}
                          className="data-[state=checked]:bg-blue-600"
                        />
                        <span className="text-xs text-gray-400">Auto</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Automation Status */}
                  <div className="bg-gray-800 rounded p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-400">Smart Automation</span>
                      <div className="flex items-center gap-1">
                        <div className={`w-2 h-2 rounded-full ${automation.shouldBeOn ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="text-xs text-gray-400">
                          {automation.shouldBeOn ? 'ON' : 'OFF'}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-300">{automation.reason}</p>
                    {automation.recommendation && (
                      <p className="text-xs text-blue-400 mt-1">{automation.recommendation}</p>
                    )}
                    {/* Show intensity recommendation for lights */}
                    {device.deviceType === "light" && intensityRec && (
                      <div className="mt-2 pt-2 border-t border-gray-600">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-gray-400">Recommended Intensity:</span>
                          <Badge variant="outline" className="text-green-400 border-green-400 text-xs">
                            {intensityRec.intensity}%
                          </Badge>
                        </div>
                        <p className="text-xs text-green-400 mt-1">
                          PPFD: {intensityRec.ppfd} μmol/m²/s
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}