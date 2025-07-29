import { 
  Smartphone, 
  Monitor, 
  Move, 
  Eye, 
  EyeOff,
  Grid,
  Layers,
  Square,
  Layout
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { useDashboardSettings } from "@/hooks/use-dashboard-settings";

const WIDGET_NAMES = {
  environment: "Environment",
  plants: "Plants", 
  calendar: "Calendar",
  analytics: "Analytics",
  controls: "Controls",
};

export default function AdvancedSettings() {
  const { 
    settings, 
    updateSettings,
    moveWidgetToTaskbar,
    moveWidgetToDashboard,
    hideWidget
  } = useDashboardSettings();

  const allWidgets = Object.keys(WIDGET_NAMES) as (keyof typeof WIDGET_NAMES)[];
  const visibleWidgets = settings.widgetOrder.filter(w => !settings.hiddenWidgets.includes(w));
  const hiddenWidgets = settings.hiddenWidgets;
  const taskbarWidgets = settings.taskbarWidgets;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Advanced Layout Options */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Layout className="w-5 h-5 mr-2" />
            Advanced Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Layout with new freeform option */}
          <div className="space-y-2">
            <Label>Dashboard Layout</Label>
            <Select 
              value={settings.layout} 
              onValueChange={(value: any) => 
                updateSettings({ ...settings, layout: value })
              }
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="grid">
                  <div className="flex items-center">
                    <Grid className="w-4 h-4 mr-2" />
                    Grid Layout
                  </div>
                </SelectItem>
                <SelectItem value="masonry">
                  <div className="flex items-center">
                    <Layers className="w-4 h-4 mr-2" />
                    Masonry Layout
                  </div>
                </SelectItem>
                <SelectItem value="compact">
                  <div className="flex items-center">
                    <Square className="w-4 h-4 mr-2" />
                    Compact Layout
                  </div>
                </SelectItem>
                <SelectItem value="freeform">
                  <div className="flex items-center">
                    <Move className="w-4 h-4 mr-2" />
                    Freeform Layout
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              {settings.layout === "freeform" && "Drag and drop widgets anywhere on the screen"}
              {settings.layout === "grid" && "Organized grid with responsive columns"}
              {settings.layout === "masonry" && "Pinterest-style layout with varying heights"}
              {settings.layout === "compact" && "Dense layout for maximum information"}
            </p>
          </div>

          {/* Drag and Drop Toggle */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Drag & Drop</Label>
              <p className="text-xs text-gray-400">Allow widgets to be repositioned</p>
            </div>
            <Switch
              checked={settings.enableDragDrop}
              onCheckedChange={(checked) => 
                updateSettings({ ...settings, enableDragDrop: checked })
              }
            />
          </div>
        </CardContent>
      </Card>

      {/* Mobile Layout Settings */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Smartphone className="w-5 h-5 mr-2" />
            Mobile Layout
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Mobile Display Mode</Label>
            <Select 
              value={settings.mobileLayout} 
              onValueChange={(value: any) => 
                updateSettings({ ...settings, mobileLayout: value })
              }
            >
              <SelectTrigger className="bg-gray-700 border-gray-600">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-gray-800 border-gray-700">
                <SelectItem value="stack">
                  <div className="flex items-center">
                    <Square className="w-4 h-4 mr-2" />
                    Stack (Vertical)
                  </div>
                </SelectItem>
                <SelectItem value="tabs">
                  <div className="flex items-center">
                    <Grid className="w-4 h-4 mr-2" />
                    Tabs (Horizontal)
                  </div>
                </SelectItem>
                <SelectItem value="accordion">
                  <div className="flex items-center">
                    <Layers className="w-4 h-4 mr-2" />
                    Accordion (Collapsible)
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-gray-400">
              How widgets are displayed on mobile devices
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Widget Management */}
      <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Monitor className="w-5 h-5 mr-2" />
            Widget Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dashboard Widgets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">Dashboard Widgets</Label>
              <Badge variant="outline" className="text-xs">
                {visibleWidgets.length} active
              </Badge>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {visibleWidgets.map((widgetName) => (
                <div
                  key={widgetName}
                  className="flex items-center justify-between p-3 bg-gray-700 rounded-lg"
                >
                  <div className="flex items-center">
                    <Eye className="w-4 h-4 mr-2 text-green-500" />
                    <span className="text-sm font-medium">
                      {WIDGET_NAMES[widgetName as keyof typeof WIDGET_NAMES]}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveWidgetToTaskbar(widgetName)}
                      className="h-7 px-2 text-xs hover:bg-blue-600"
                    >
                      <Move className="w-3 h-3 mr-1" />
                      Taskbar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => hideWidget(widgetName)}
                      className="h-7 px-2 text-xs hover:bg-red-600"
                    >
                      <EyeOff className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-gray-600" />

          {/* Taskbar Widgets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">Taskbar Widgets</Label>
              <Badge variant="outline" className="text-xs bg-blue-600 border-blue-600">
                {taskbarWidgets.length} in taskbar
              </Badge>
            </div>
            {taskbarWidgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {taskbarWidgets.map((widgetName) => (
                  <div
                    key={widgetName}
                    className="flex items-center justify-between p-3 bg-blue-900/30 border border-blue-600/30 rounded-lg"
                  >
                    <div className="flex items-center">
                      <Move className="w-4 h-4 mr-2 text-blue-400" />
                      <span className="text-sm font-medium">
                        {WIDGET_NAMES[widgetName as keyof typeof WIDGET_NAMES]}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => moveWidgetToDashboard(widgetName)}
                        className="h-7 px-2 text-xs hover:bg-green-600"
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        Dashboard
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => hideWidget(widgetName)}
                        className="h-7 px-2 text-xs hover:bg-red-600"
                      >
                        <EyeOff className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Move className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No widgets in taskbar</p>
                <p className="text-xs">Move widgets here for quick access</p>
              </div>
            )}
          </div>

          <Separator className="bg-gray-600" />

          {/* Hidden Widgets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base">Hidden Widgets</Label>
              <Badge variant="outline" className="text-xs bg-red-600 border-red-600">
                {hiddenWidgets.length} hidden
              </Badge>
            </div>
            {hiddenWidgets.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {hiddenWidgets.map((widgetName) => (
                  <div
                    key={widgetName}
                    className="flex items-center justify-between p-3 bg-red-900/30 border border-red-600/30 rounded-lg"
                  >
                    <div className="flex items-center">
                      <EyeOff className="w-4 h-4 mr-2 text-red-400" />
                      <span className="text-sm font-medium text-gray-400">
                        {WIDGET_NAMES[widgetName as keyof typeof WIDGET_NAMES]}
                      </span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => moveWidgetToDashboard(widgetName)}
                      className="h-7 px-2 text-xs hover:bg-green-600"
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      Show
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-gray-400">
                <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No hidden widgets</p>
                <p className="text-xs">All widgets are currently visible</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}