import { useState } from "react";
import { 
  Monitor, 
  Sprout, 
  Calendar, 
  BarChart3, 
  Gamepad2,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

interface MobileDashboardProps {
  children: (widgetName: string) => React.ReactNode;
}

const WIDGET_ICONS = {
  environment: Monitor,
  plants: Sprout,
  calendar: Calendar,
  analytics: BarChart3,
  controls: Gamepad2,
};

const WIDGET_NAMES = {
  environment: "Environment",
  plants: "Plants", 
  calendar: "Calendar",
  analytics: "Analytics",
  controls: "Controls",
};

export default function MobileDashboard({ children }: MobileDashboardProps) {
  const { settings } = useDashboardSettings();
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  
  const visibleWidgets = settings.widgetOrder.filter(
    widget => !settings.hiddenWidgets.includes(widget)
  );

  const toggleSection = (widgetName: string) => {
    setOpenSections(prev => ({
      ...prev,
      [widgetName]: !prev[widgetName]
    }));
  };

  if (settings.mobileLayout === "tabs") {
    return (
      <div className="md:hidden">
        <Tabs defaultValue={visibleWidgets[0]} className="w-full">
          <TabsList className="grid w-full bg-gray-800 border-gray-700" style={{
            gridTemplateColumns: `repeat(${Math.min(visibleWidgets.length, 5)}, minmax(0, 1fr))`
          }}>
            {visibleWidgets.slice(0, 5).map((widgetName) => {
              const Icon = WIDGET_ICONS[widgetName as keyof typeof WIDGET_ICONS];
              return (
                <TabsTrigger
                  key={widgetName}
                  value={widgetName}
                  className="flex flex-col items-center p-2 text-xs data-[state=active]:bg-plant-green-600"
                >
                  <Icon className="w-4 h-4 mb-1" />
                  <span className="hidden xs:inline">
                    {WIDGET_NAMES[widgetName as keyof typeof WIDGET_NAMES]}
                  </span>
                </TabsTrigger>
              );
            })}
          </TabsList>
          
          {visibleWidgets.map((widgetName) => (
            <TabsContent key={widgetName} value={widgetName} className="mt-4">
              <div className="bg-gray-800 rounded-lg p-4 min-h-[60vh]">
                {children(widgetName)}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    );
  }

  if (settings.mobileLayout === "accordion") {
    return (
      <div className="md:hidden space-y-2">
        {visibleWidgets.map((widgetName) => {
          const Icon = WIDGET_ICONS[widgetName as keyof typeof WIDGET_ICONS];
          const isOpen = openSections[widgetName];
          
          return (
            <Collapsible
              key={widgetName}
              open={isOpen}
              onOpenChange={() => toggleSection(widgetName)}
            >
              <CollapsibleTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-between bg-gray-800 hover:bg-gray-700 border-gray-700 p-4"
                >
                  <div className="flex items-center space-x-3">
                    <Icon className="w-5 h-5" />
                    <span className="font-medium">
                      {WIDGET_NAMES[widgetName as keyof typeof WIDGET_NAMES]}
                    </span>
                  </div>
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="space-y-2">
                <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
                  {children(widgetName)}
                </div>
              </CollapsibleContent>
            </Collapsible>
          );
        })}
      </div>
    );
  }

  // Default: Stack layout
  return (
    <div className="md:hidden space-y-6">
      {visibleWidgets.map((widgetName) => {
        const Icon = WIDGET_ICONS[widgetName as keyof typeof WIDGET_ICONS];
        
        return (
          <div key={widgetName} className="bg-gray-800 rounded-lg p-6">
            <div className="flex items-center space-x-3 mb-4">
              <Icon className="w-6 h-6 text-plant-green-500" />
              <h3 className="text-xl font-bold text-white">
                {WIDGET_NAMES[widgetName as keyof typeof WIDGET_NAMES]}
              </h3>
            </div>
            {children(widgetName)}
          </div>
        );
      })}
    </div>
  );
}