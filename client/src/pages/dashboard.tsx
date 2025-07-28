import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sprout, Plus, Settings, Bell } from "lucide-react";
import EnvironmentCard from "@/components/environment-card";

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

  const { data: sensorDataArray = [] } = useQuery<SensorData[]>({
    queryKey: ["/api/sensor-data"],
    refetchInterval: settings.refreshInterval * 1000,
  });
  
  const sensorData = sensorDataArray[0]; // Use first sensor data for dashboard

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
              <Button 
                size="sm" 
                className="bg-plant-green-600 hover:bg-plant-green-700"
                onClick={() => {
                  // Scroll to the plants section or show add plant form
                  const plantsSection = document.querySelector('[data-widget="plants"]');
                  if (plantsSection) {
                    plantsSection.scrollIntoView({ behavior: 'smooth' });
                  }
                }}
              >
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

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
          <p className="text-gray-400">Monitor your plants and growing environment</p>
        </div>

        {/* Customizable Dashboard Grid */}
        <div className={getLayoutClassName()}>
          {settings.widgetOrder?.map((widgetName) => {
            switch (widgetName) {
              case "environment":
                return (
                  <div key="environment" className={getWidgetClassName("environment")}>
                    <h3 className="text-xl font-bold text-white mb-4">Environment</h3>
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
                );
              case "plants":
                return (
                  <div key="plants" className={getWidgetClassName("plants")} data-widget="plants">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-xl font-bold text-white">Plants</h3>
                      <Button 
                        size="sm" 
                        className="bg-plant-green-600 hover:bg-plant-green-700"
                        onClick={() => {
                          // Show add plant form - we'll create a modal or expand form
                          const addPlantSection = document.querySelector('[data-add-plant]');
                          if (addPlantSection) {
                            addPlantSection.scrollIntoView({ behavior: 'smooth' });
                          }
                        }}
                      >
                        <Plus className="w-4 h-4 mr-2" />
                        Add
                      </Button>
                    </div>
                    <div className="overflow-y-auto h-full space-y-4">
                      <PlantsGrid plants={plants} />
                      <div data-add-plant>
                        <AddPlantForm />
                      </div>
                    </div>
                  </div>
                );
              case "controls":
                return (
                  <div key="controls" className={getWidgetClassName("controls")}>
                    <h3 className="text-xl font-bold text-white mb-4">Plant Controls</h3>
                    <div className="overflow-y-auto h-full bg-gray-800 rounded-lg p-6 border border-gray-700">
                      <div className="text-center">
                        <div className="w-16 h-16 bg-plant-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Sprout className="w-8 h-8 text-white" />
                        </div>
                        <h4 className="text-white font-semibold mb-2">Device Controls Moved</h4>
                        <p className="text-gray-400 mb-4">
                          Device controls are now individual to each plant. Visit any plant's detail page to access its specific controls and sensors.
                        </p>
                        {plants.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-sm text-gray-400 mb-2">Quick access to plant controls:</p>
                            {plants.slice(0, 3).map(plant => (
                              <Link key={plant.id} href={`/plant/${plant.id}`}>
                                <Button variant="outline" size="sm" className="w-full">
                                  {plant.name} Controls
                                </Button>
                              </Link>
                            ))}
                            {plants.length > 3 && (
                              <p className="text-xs text-gray-500">+ {plants.length - 3} more plants</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              case "calendar":
                return (
                  <div key="calendar" className={getWidgetClassName("calendar")}>
                    <h3 className="text-xl font-bold text-white mb-4">Calendar</h3>
                    <div className="overflow-y-auto h-full">
                      <CareCalendar />
                    </div>
                  </div>
                );
              case "analytics":
                return (
                  <div key="analytics" className={getWidgetClassName("analytics")}>
                    <h3 className="text-xl font-bold text-white mb-4">Analytics</h3>
                    <div className="overflow-y-auto h-full">
                      <AnalyticsPanel plants={plants} />
                    </div>
                  </div>
                );
              default:
                return null;
            }
          })}
        </div>
      </div>
    </div>
  );
}
