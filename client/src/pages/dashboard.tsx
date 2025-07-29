import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Sprout, Plus, Settings, Bell, Layout, Eye } from "lucide-react";
import EnvironmentCard from "@/components/environment-card";
import CameraSection from "@/components/camera-section";
import AddPlantForm from "@/components/add-plant-form";
import PlantsGrid from "@/components/plants-grid";
import CareCalendar from "@/components/care-calendar";
import AnalyticsPanel from "@/components/analytics-panel";
import SystemStatus from "@/components/system-status";
import WidgetTaskbar from "@/components/widget-taskbar";
import WidgetHeader from "@/components/widget-header";
import MobileDashboard from "@/components/mobile-dashboard";
import { Button } from "@/components/ui/button";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import type { Plant, SensorData, DeviceState } from "@shared/schema";

export default function Dashboard() {
  const { 
    settings, 
    updateSettings,
    getWidgetClassName, 
    getLayoutClassName,
    moveWidgetToDashboard 
  } = useDashboardSettings();
  
  const isMobile = useIsMobile();
  
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

  // Widget rendering function for reuse in mobile and desktop
  const renderWidget = (widgetName: string) => {
    switch (widgetName) {
      case "environment":
        return (
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
        );
      case "plants":
        return (
          <div className="space-y-4 h-full overflow-y-auto">
            <PlantsGrid plants={plants} />
            <div data-add-plant>
              <AddPlantForm />
            </div>
          </div>
        );
      case "controls":
        return (
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
        );
      case "calendar":
        return (
          <div className="h-full overflow-y-auto">
            <CareCalendar />
          </div>
        );
      case "analytics":
        return (
          <div className="h-full overflow-y-auto">
            <AnalyticsPanel plants={plants} />
          </div>
        );
      default:
        return null;
    }
  };

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
              
              {/* Layout Quick Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button size="sm" variant="secondary">
                    <Layout className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="bg-gray-800 border-gray-700" align="end">
                  <DropdownMenuItem
                    onClick={() => updateSettings({...settings, layout: "grid"})}
                    className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${settings.layout === "grid" ? "bg-gray-700" : ""}`}
                  >
                    Grid Layout
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateSettings({...settings, layout: "masonry"})}
                    className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${settings.layout === "masonry" ? "bg-gray-700" : ""}`}
                  >
                    Masonry Layout
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateSettings({...settings, layout: "compact"})}
                    className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${settings.layout === "compact" ? "bg-gray-700" : ""}`}
                  >
                    Compact Layout
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-gray-600" />
                  {settings.hiddenWidgets.length > 0 && (
                    <>
                      <DropdownMenuItem className="text-gray-400 font-medium">
                        Show Hidden Widgets
                      </DropdownMenuItem>
                      {settings.hiddenWidgets.map((widgetName) => (
                        <DropdownMenuItem
                          key={widgetName}
                          onClick={() => moveWidgetToDashboard(widgetName)}
                          className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                        >
                          <Eye className="w-4 h-4 mr-2" />
                          {widgetName.charAt(0).toUpperCase() + widgetName.slice(1)}
                        </DropdownMenuItem>
                      ))}
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

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

      {/* Widget Taskbar */}
      <WidgetTaskbar>
        {renderWidget}
      </WidgetTaskbar>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 pb-20">
        {/* Dashboard Header */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">Dashboard Overview</h2>
          <p className="text-gray-400">Monitor your plants and growing environment</p>
        </div>

        {/* Mobile Dashboard */}
        <MobileDashboard>
          {renderWidget}
        </MobileDashboard>

        {/* Desktop Dashboard Grid */}
        <div className={`${getLayoutClassName()} ${isMobile ? 'hidden md:block' : ''}`}>
          {settings.widgetOrder
            ?.filter(widgetName => !settings.hiddenWidgets.includes(widgetName))
            .map((widgetName) => (
              <div key={widgetName} className={getWidgetClassName(widgetName as keyof typeof settings.widgetSizes)} data-widget={widgetName}>
                <WidgetHeader
                  widgetName={widgetName}
                  title={widgetName.charAt(0).toUpperCase() + widgetName.slice(1)}
                  showControls={!isMobile && settings.enableDragDrop}
                >
                  {widgetName === "plants" && (
                    <Button 
                      size="sm" 
                      className="bg-plant-green-600 hover:bg-plant-green-700"
                      onClick={() => {
                        const addPlantSection = document.querySelector('[data-add-plant]');
                        if (addPlantSection) {
                          addPlantSection.scrollIntoView({ behavior: 'smooth' });
                        }
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add
                    </Button>
                  )}
                </WidgetHeader>
                {renderWidget(widgetName)}
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
