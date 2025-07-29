import { useState } from "react";
import { 
  ChevronDown, 
  ChevronUp, 
  Settings, 
  Monitor, 
  Sprout, 
  Calendar, 
  BarChart3, 
  Gamepad2,
  X,
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface WidgetTaskbarProps {
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

export default function WidgetTaskbar({ children }: WidgetTaskbarProps) {
  const { 
    settings, 
    moveWidgetToDashboard, 
    hideWidget 
  } = useDashboardSettings();
  
  const [expandedWidget, setExpandedWidget] = useState<string | null>(null);

  if (settings.taskbarWidgets.length === 0) {
    return null;
  }

  return (
    <div className="bg-gray-800 border-b border-gray-700 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2">
          {/* Taskbar Widgets */}
          <div className="flex items-center space-x-2 overflow-x-auto">
            {settings.taskbarWidgets.map((widgetName) => {
              const Icon = WIDGET_ICONS[widgetName as keyof typeof WIDGET_ICONS];
              const isExpanded = expandedWidget === widgetName;
              
              return (
                <div key={widgetName} className="flex-shrink-0">
                  <Popover 
                    open={isExpanded} 
                    onOpenChange={(open) => setExpandedWidget(open ? widgetName : null)}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center space-x-2 bg-gray-700 hover:bg-gray-600 border-gray-600"
                      >
                        <Icon className="w-4 h-4" />
                        <span className="hidden sm:inline">
                          {WIDGET_NAMES[widgetName as keyof typeof WIDGET_NAMES]}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="w-80 md:w-96 p-0 bg-gray-800 border-gray-700" 
                      align="start"
                    >
                      <div className="bg-gray-800 rounded-lg border border-gray-700 max-h-80 overflow-y-auto">
                        <div className="p-4 border-b border-gray-700 flex items-center justify-between">
                          <h3 className="text-sm font-medium text-white">
                            {WIDGET_NAMES[widgetName as keyof typeof WIDGET_NAMES]}
                          </h3>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                moveWidgetToDashboard(widgetName);
                                setExpandedWidget(null);
                              }}
                              className="h-7 px-2 text-xs bg-plant-green-600 hover:bg-plant-green-700 border-plant-green-600"
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Move to Dashboard
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                hideWidget(widgetName);
                                setExpandedWidget(null);
                              }}
                              className="h-7 px-2 text-xs hover:bg-red-600 hover:border-red-600"
                            >
                              <X className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                        <div className="p-4">
                          {children(widgetName)}
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              );
            })}
          </div>

          {/* Add Widget Button */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="outline"
                className="bg-gray-700 hover:bg-gray-600 border-gray-600"
              >
                <Settings className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700" align="end">
              <DropdownMenuItem className="text-gray-300 hover:bg-gray-700">
                <span className="text-sm font-medium">Manage Widgets</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-600" />
              {settings.hiddenWidgets.map((widgetName) => {
                const Icon = WIDGET_ICONS[widgetName as keyof typeof WIDGET_ICONS];
                return (
                  <DropdownMenuItem
                    key={widgetName}
                    onClick={() => moveWidgetToDashboard(widgetName)}
                    className="text-gray-300 hover:bg-gray-700 cursor-pointer"
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    Show {WIDGET_NAMES[widgetName as keyof typeof WIDGET_NAMES]}
                  </DropdownMenuItem>
                );
              })}
              {settings.hiddenWidgets.length === 0 && (
                <DropdownMenuItem disabled className="text-gray-500">
                  No hidden widgets
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}