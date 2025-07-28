import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sprout, Plus, Settings, Bell } from "lucide-react";
import EnvironmentCard from "@/components/environment-card";
import ControlPanel from "@/components/control-panel";
import CameraSection from "@/components/camera-section";
import AddPlantForm from "@/components/add-plant-form";
import PlantsGrid from "@/components/plants-grid";
import CareCalendar from "@/components/care-calendar";
import AnalyticsPanel from "@/components/analytics-panel";
import SystemStatus from "@/components/system-status";
import { Button } from "@/components/ui/button";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import type { Plant, SensorData, DeviceState } from "@shared/schema";

export default function Dashboard() {
  const { settings, getWidgetClassName, getLayoutClassName } = useDashboardSettings();
  
  const { data: plants = [] } = useQuery<Plant[]>({
    queryKey: ["/api/plants"],
  });

  const { data: sensorData } = useQuery<SensorData>({
    queryKey: ["/api/sensor-data"],
    refetchInterval: settings.refreshInterval * 1000,
  });

  const { data: devices = [] } = useQuery<DeviceState[]>({
    queryKey: ["/api/devices"],
  });

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Navigation Header */}
      <nav className="bg-gray-800 border-b border-gray-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center space-x-3">
                <div className="w-8 h-8 bg-plant-green-500 rounded-lg flex items-center justify-center">
                  <Sprout className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-white">SmartGrow</h1>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button size="sm" className="bg-plant-green-600 hover:bg-plant-green-700">
                <Plus className="w-4 h-4 mr-2" />
                Add Plant
              </Button>
              <Button size="sm" variant="secondary">
                <Bell className="w-4 h-4" />
              </Button>
              <Link href="/settings">
                <Button size="sm" variant="secondary">
                  <Settings className="w-4 h-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
          <p className="text-gray-400">Monitor your plants and growing environment</p>
        </div>

        {/* Customizable Dashboard Grid */}
        <div className={getLayoutClassName()}>
          {/* Environment Monitoring */}
          <div className={`${getWidgetClassName("environment")} ${settings.layout === "compact" ? "col-span-3" : "md:col-span-3"}`}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full">
              <EnvironmentCard
                title="Temperature"
                value={sensorData?.temperature || 0}
                unit="°C"
                status="Optimal range"
                icon="temperature"
                iconColor="bg-red-600"
              />
              <EnvironmentCard
                title="Humidity"
                value={sensorData?.humidity || 0}
                unit="%"
                status="Good levels"
                icon="humidity"
                iconColor="bg-blue-600"
              />
              <EnvironmentCard
                title="Soil Moisture"
                value={sensorData?.soilMoisture || 0}
                unit="units"
                status={sensorData?.soilMoisture && sensorData.soilMoisture < 300 ? "Needs watering" : "Good levels"}
                icon="soil"
                iconColor="bg-amber-600"
              />
            </div>
          </div>

          {/* Plants Grid */}
          <div className={getWidgetClassName("plants")}>
            <PlantsGrid plants={plants} />
          </div>

          {/* Control Panel */}
          <div className={getWidgetClassName("controls")}>
            <ControlPanel devices={devices} />
          </div>

          {/* Care Calendar */}
          <div className={getWidgetClassName("calendar")}>
            <CareCalendar />
          </div>

          {/* Analytics Panel */}
          <div className={getWidgetClassName("analytics")}>
            <AnalyticsPanel plants={plants} />
          </div>
        </div>
      </div>
    </div>
  );
}
