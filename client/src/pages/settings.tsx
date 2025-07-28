import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { ArrowLeft, Monitor, Palette, Layout, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

interface DashboardSettings {
  layout: "grid" | "masonry" | "compact";
  widgetSizes: {
    environment: "small" | "medium" | "large";
    plants: "small" | "medium" | "large";
    calendar: "small" | "medium" | "large";
    controls: "small" | "medium" | "large";
    analytics: "small" | "medium" | "large";
  };
  theme: "dark" | "light" | "auto";
  compactMode: boolean;
  showGridLines: boolean;
  refreshInterval: number; // seconds
}

const DEFAULT_SETTINGS: DashboardSettings = {
  layout: "grid",
  widgetSizes: {
    environment: "medium",
    plants: "large",
    calendar: "medium",
    controls: "small",
    analytics: "medium",
  },
  theme: "dark",
  compactMode: false,
  showGridLines: false,
  refreshInterval: 5,
};

export default function Settings() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Load settings from localStorage or use defaults
  const [settings, setSettings] = useState<DashboardSettings>(() => {
    const saved = localStorage.getItem("dashboard-settings");
    return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
  });

  const saveSettings = useMutation({
    mutationFn: async (newSettings: DashboardSettings) => {
      localStorage.setItem("dashboard-settings", JSON.stringify(newSettings));
      // Trigger a dashboard refresh
      queryClient.invalidateQueries({ queryKey: ["dashboard-settings"] });
      return newSettings;
    },
    onSuccess: () => {
      toast({
        title: "Settings saved",
        description: "Dashboard settings have been applied successfully.",
      });
    },
  });

  const handleSave = () => {
    saveSettings.mutate(settings);
  };

  const resetToDefaults = () => {
    setSettings(DEFAULT_SETTINGS);
    toast({
      title: "Settings reset",
      description: "Dashboard settings have been reset to defaults.",
    });
  };

  const updateWidgetSize = (widget: keyof DashboardSettings["widgetSizes"], size: "small" | "medium" | "large") => {
    setSettings(prev => ({
      ...prev,
      widgetSizes: {
        ...prev.widgetSizes,
        [widget]: size,
      },
    }));
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">Dashboard Settings</h1>
                <p className="text-gray-400 mt-1">Customize your growing dashboard experience</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={resetToDefaults}>
                Reset to Defaults
              </Button>
              <Button 
                onClick={handleSave}
                disabled={saveSettings.isPending}
                className="bg-plant-green-600 hover:bg-plant-green-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Settings
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Layout Settings */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Layout className="w-5 h-5 mr-2" />
                Layout & Display
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Layout Type */}
              <div className="space-y-2">
                <Label>Dashboard Layout</Label>
                <Select 
                  value={settings.layout} 
                  onValueChange={(value: "grid" | "masonry" | "compact") => 
                    setSettings(prev => ({ ...prev, layout: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="grid">Grid Layout</SelectItem>
                    <SelectItem value="masonry">Masonry Layout</SelectItem>
                    <SelectItem value="compact">Compact Layout</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Theme */}
              <div className="space-y-2">
                <Label>Theme</Label>
                <Select 
                  value={settings.theme} 
                  onValueChange={(value: "dark" | "light" | "auto") => 
                    setSettings(prev => ({ ...prev, theme: value }))
                  }
                >
                  <SelectTrigger className="bg-gray-700 border-gray-600">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark Theme</SelectItem>
                    <SelectItem value="light">Light Theme</SelectItem>
                    <SelectItem value="auto">Auto (System)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Display Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Compact Mode</Label>
                  <Switch
                    checked={settings.compactMode}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, compactMode: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Show Grid Lines</Label>
                  <Switch
                    checked={settings.showGridLines}
                    onCheckedChange={(checked) => 
                      setSettings(prev => ({ ...prev, showGridLines: checked }))
                    }
                  />
                </div>
              </div>

              {/* Refresh Interval */}
              <div className="space-y-2">
                <Label>Data Refresh Interval: {settings.refreshInterval}s</Label>
                <Slider
                  value={[settings.refreshInterval]}
                  onValueChange={([value]) => 
                    setSettings(prev => ({ ...prev, refreshInterval: value }))
                  }
                  min={1}
                  max={30}
                  step={1}
                  className="w-full"
                />
              </div>
            </CardContent>
          </Card>

          {/* Widget Sizes */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Monitor className="w-5 h-5 mr-2" />
                Widget Sizes
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Object.entries(settings.widgetSizes).map(([widget, size]) => (
                <div key={widget} className="space-y-2">
                  <Label className="capitalize">{widget.replace(/([A-Z])/g, ' $1')}</Label>
                  <Select 
                    value={size} 
                    onValueChange={(value: "small" | "medium" | "large") => 
                      updateWidgetSize(widget as keyof DashboardSettings["widgetSizes"], value)
                    }
                  >
                    <SelectTrigger className="bg-gray-700 border-gray-600">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Preview Card */}
          <Card className="bg-gray-800 border-gray-700 lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Palette className="w-5 h-5 mr-2" />
                Preview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`p-4 rounded-lg ${settings.showGridLines ? 'border border-gray-600' : ''}`}>
                <div className={`grid gap-4 ${
                  settings.layout === 'compact' ? 'grid-cols-4' : 
                  settings.layout === 'masonry' ? 'grid-cols-3' : 'grid-cols-2'
                }`}>
                  {Object.entries(settings.widgetSizes).map(([widget, size]) => (
                    <div
                      key={widget}
                      className={`bg-gray-700 rounded p-3 ${
                        size === 'small' ? 'h-16' : 
                        size === 'medium' ? 'h-24' : 'h-32'
                      } ${settings.compactMode ? 'p-2' : 'p-3'}`}
                    >
                      <div className={`text-xs text-gray-400 ${settings.compactMode ? 'text-xs' : 'text-sm'}`}>
                        {widget.charAt(0).toUpperCase() + widget.slice(1)}
                      </div>
                      <div className="text-gray-300 text-xs mt-1">{size}</div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}