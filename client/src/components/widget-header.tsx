import { 
  MoreVertical, 
  ArrowUp, 
  ArrowDown, 
  Eye, 
  EyeOff, 
  Move, 
  Maximize2, 
  Minimize2 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";

interface WidgetHeaderProps {
  widgetName: string;
  title: string;
  children?: React.ReactNode;
  showControls?: boolean;
}

export default function WidgetHeader({ 
  widgetName, 
  title, 
  children, 
  showControls = true 
}: WidgetHeaderProps) {
  const { 
    settings, 
    updateSettings,
    moveWidgetToTaskbar, 
    hideWidget 
  } = useDashboardSettings();

  const currentSize = settings.widgetSizes[widgetName as keyof typeof settings.widgetSizes];
  const widgetIndex = settings.widgetOrder.indexOf(widgetName);

  const updateWidgetSize = (size: "small" | "medium" | "large" | "xlarge") => {
    const newSettings = {
      ...settings,
      widgetSizes: {
        ...settings.widgetSizes,
        [widgetName]: size
      }
    };
    updateSettings(newSettings);
  };

  const moveWidgetUp = () => {
    if (widgetIndex > 0) {
      const newOrder = [...settings.widgetOrder];
      [newOrder[widgetIndex], newOrder[widgetIndex - 1]] = [newOrder[widgetIndex - 1], newOrder[widgetIndex]];
      const newSettings = { ...settings, widgetOrder: newOrder };
      updateSettings(newSettings);
    }
  };

  const moveWidgetDown = () => {
    if (widgetIndex < settings.widgetOrder.length - 1) {
      const newOrder = [...settings.widgetOrder];
      [newOrder[widgetIndex], newOrder[widgetIndex + 1]] = [newOrder[widgetIndex + 1], newOrder[widgetIndex]];
      const newSettings = { ...settings, widgetOrder: newOrder };
      updateSettings(newSettings);
    }
  };

  if (!showControls) {
    return (
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xl font-bold text-white">{title}</h3>
        {children}
      </div>
    );
  }

  return (
    <div className="flex justify-between items-center mb-4 group">
      <h3 className="text-xl font-bold text-white">{title}</h3>
      <div className="flex items-center space-x-2">
        {children}
        
        {/* Widget Controls */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                variant="ghost"
                className="h-8 w-8 p-0 hover:bg-gray-700"
              >
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-gray-800 border-gray-700" align="end">
              {/* Size Controls */}
              <DropdownMenuSub>
                <DropdownMenuSubTrigger className="text-gray-300 hover:bg-gray-700">
                  <Maximize2 className="w-4 h-4 mr-2" />
                  Resize
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent className="bg-gray-800 border-gray-700">
                  <DropdownMenuItem
                    onClick={() => updateWidgetSize("small")}
                    className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${
                      currentSize === "small" ? "bg-gray-700" : ""
                    }`}
                  >
                    <Minimize2 className="w-4 h-4 mr-2" />
                    Small
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateWidgetSize("medium")}
                    className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${
                      currentSize === "medium" ? "bg-gray-700" : ""
                    }`}
                  >
                    Medium
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateWidgetSize("large")}
                    className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${
                      currentSize === "large" ? "bg-gray-700" : ""
                    }`}
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Large
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => updateWidgetSize("xlarge")}
                    className={`text-gray-300 hover:bg-gray-700 cursor-pointer ${
                      currentSize === "xlarge" ? "bg-gray-700" : ""
                    }`}
                  >
                    <Maximize2 className="w-4 h-4 mr-2" />
                    Extra Large
                  </DropdownMenuItem>
                </DropdownMenuSubContent>
              </DropdownMenuSub>

              <DropdownMenuSeparator className="bg-gray-600" />

              {/* Position Controls */}
              <DropdownMenuItem
                onClick={moveWidgetUp}
                disabled={widgetIndex === 0}
                className="text-gray-300 hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Move Up
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={moveWidgetDown}
                disabled={widgetIndex === settings.widgetOrder.length - 1}
                className="text-gray-300 hover:bg-gray-700 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDown className="w-4 h-4 mr-2" />
                Move Down
              </DropdownMenuItem>

              <DropdownMenuSeparator className="bg-gray-600" />

              {/* Widget Actions */}
              <DropdownMenuItem
                onClick={() => moveWidgetToTaskbar(widgetName)}
                className="text-gray-300 hover:bg-gray-700 cursor-pointer"
              >
                <Move className="w-4 h-4 mr-2" />
                Move to Taskbar
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => hideWidget(widgetName)}
                className="text-gray-300 hover:bg-gray-700 cursor-pointer"
              >
                <EyeOff className="w-4 h-4 mr-2" />
                Hide Widget
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}