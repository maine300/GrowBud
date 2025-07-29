import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export interface DashboardSettings {
  layout: "grid" | "masonry" | "compact" | "freeform";
  widgetSizes: {
    environment: "small" | "medium" | "large" | "xlarge";
    plants: "small" | "medium" | "large" | "xlarge";
    calendar: "small" | "medium" | "large" | "xlarge";
    controls: "small" | "medium" | "large" | "xlarge";
    analytics: "small" | "medium" | "large" | "xlarge";
  };
  widgetOrder: string[]; // Array of widget names in display order
  hiddenWidgets: string[]; // Widgets removed from main dashboard
  taskbarWidgets: string[]; // Widgets in the top taskbar
  widgetPositions: Record<string, { x: number; y: number; w: number; h: number }>; // For freeform layout
  theme: "dark" | "light" | "auto";
  compactMode: boolean;
  showGridLines: boolean;
  refreshInterval: number; // seconds
  mobileLayout: "stack" | "tabs" | "accordion"; // Mobile-specific layout
  enableDragDrop: boolean;
}

const DEFAULT_SETTINGS: DashboardSettings = {
  layout: "grid",
  widgetSizes: {
    environment: "medium",
    plants: "large",
    calendar: "large",
    controls: "small",
    analytics: "medium",
  },
  widgetOrder: ["environment", "plants", "calendar", "controls", "analytics"],
  hiddenWidgets: [],
  taskbarWidgets: [],
  widgetPositions: {},
  theme: "dark",
  compactMode: false,
  showGridLines: false,
  refreshInterval: 5,
  mobileLayout: "stack",
  enableDragDrop: false,
};

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(() => {
    try {
      const saved = localStorage.getItem("dashboard-settings");
      if (saved) {
        const parsed = JSON.parse(saved);
        // Ensure widgetOrder exists and has default value
        if (!parsed.widgetOrder) {
          parsed.widgetOrder = DEFAULT_SETTINGS.widgetOrder;
        }
        // Update calendar size to large if it's still medium from old settings
        if (parsed.widgetSizes?.calendar === "medium") {
          parsed.widgetSizes.calendar = "large";
          localStorage.setItem("dashboard-settings", JSON.stringify(parsed));
        }
        return parsed;
      }
      return DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  });

  // Query to trigger re-renders when settings change
  const { refetch } = useQuery({
    queryKey: ["dashboard-settings"],
    queryFn: () => {
      const saved = localStorage.getItem("dashboard-settings");
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
    },
    enabled: false,
  });

  useEffect(() => {
    const handleStorageChange = () => {
      refetch();
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [refetch]);

  const updateSettings = (newSettings: DashboardSettings) => {
    setSettings(newSettings);
    localStorage.setItem("dashboard-settings", JSON.stringify(newSettings));
  };

  const getWidgetClassName = (widget: keyof DashboardSettings["widgetSizes"]) => {
    const size = settings.widgetSizes[widget];
    const isCompact = settings.compactMode;
    
    let className = "bg-gray-800 rounded-lg p-6 transition-all duration-300 ";
    
    // Add drag and drop capability
    if (settings.enableDragDrop) {
      className += "cursor-move hover:shadow-lg hover:shadow-plant-green-500/20 ";
    }
    
    // Size classes - enhanced with xlarge option
    switch (size) {
      case "small":
        className += widget === "calendar" 
          ? (isCompact ? "h-64" : "h-80") 
          : (isCompact ? "h-40" : "h-48");
        break;
      case "medium":
        className += widget === "calendar" 
          ? (isCompact ? "h-80" : "h-96") 
          : (isCompact ? "h-56" : "h-64");
        break;
      case "large":
        className += widget === "calendar" 
          ? (isCompact ? "h-96" : "h-[32rem]") 
          : (isCompact ? "h-72" : "h-80");
        break;
      case "xlarge":
        className += widget === "calendar" 
          ? (isCompact ? "h-[32rem]" : "h-[40rem]") 
          : (isCompact ? "h-80" : "h-96");
        break;
    }
    
    // Layout specific classes
    if (settings.layout === "freeform") {
      className += " absolute";
    } else if (settings.layout === "compact") {
      className += widget === "calendar" ? " col-span-2" : " col-span-1";
    } else if (settings.layout === "masonry") {
      if (widget === "calendar") {
        className += " col-span-2 lg:col-span-3";
      } else {
        className += (size === "large" || size === "xlarge") ? " col-span-2" : " col-span-1";
      }
    } else {
      // Grid layout - responsive columns based on size
      if (widget === "plants") {
        className += size === "xlarge" ? " col-span-1 md:col-span-3" : " col-span-1 md:col-span-2";
      } else if (widget === "environment") {
        className += size === "xlarge" ? " col-span-1 md:col-span-3" : " col-span-1 md:col-span-2 lg:col-span-3";
      } else if (widget === "calendar") {
        className += size === "xlarge" ? " col-span-1 md:col-span-3" : " col-span-1 md:col-span-2 lg:col-span-2";
      } else {
        className += (size === "large" || size === "xlarge") ? " col-span-1 md:col-span-2" : " col-span-1";
      }
    }
    
    // Grid lines
    if (settings.showGridLines) {
      className += " border-2 border-gray-600";
    }
    
    // Ensure overflow is handled
    className += " overflow-hidden";
    
    return className;
  };

  const getLayoutClassName = () => {
    const baseClass = "gap-6 min-h-0 ";
    
    switch (settings.layout) {
      case "freeform":
        return "relative min-h-screen w-full";
      case "compact":
        return baseClass + "grid auto-rows-min grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4";
      case "masonry":
        return baseClass + "grid auto-rows-min grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      default:
        return baseClass + "grid auto-rows-min grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  const getMobileLayoutClassName = () => {
    switch (settings.mobileLayout) {
      case "tabs":
        return "md:hidden"; // Only show on mobile
      case "accordion":
        return "md:hidden space-y-2";
      default:
        return "space-y-6"; // Stack layout
    }
  };

  const moveWidgetToTaskbar = (widgetName: string) => {
    const newSettings = {
      ...settings,
      taskbarWidgets: [...settings.taskbarWidgets, widgetName],
      widgetOrder: settings.widgetOrder.filter(w => w !== widgetName),
      hiddenWidgets: settings.hiddenWidgets.filter(w => w !== widgetName)
    };
    updateSettings(newSettings);
  };

  const moveWidgetToDashboard = (widgetName: string) => {
    const newSettings = {
      ...settings,
      widgetOrder: [...settings.widgetOrder, widgetName],
      taskbarWidgets: settings.taskbarWidgets.filter(w => w !== widgetName),
      hiddenWidgets: settings.hiddenWidgets.filter(w => w !== widgetName)
    };
    updateSettings(newSettings);
  };

  const hideWidget = (widgetName: string) => {
    const newSettings = {
      ...settings,
      hiddenWidgets: [...settings.hiddenWidgets, widgetName],
      widgetOrder: settings.widgetOrder.filter(w => w !== widgetName),
      taskbarWidgets: settings.taskbarWidgets.filter(w => w !== widgetName)
    };
    updateSettings(newSettings);
  };

  const reorderWidgets = (newOrder: string[]) => {
    const newSettings = {
      ...settings,
      widgetOrder: newOrder
    };
    updateSettings(newSettings);
  };

  const updateWidgetPosition = (widgetName: string, position: { x: number; y: number; w: number; h: number }) => {
    const newSettings = {
      ...settings,
      widgetPositions: {
        ...settings.widgetPositions,
        [widgetName]: position
      }
    };
    updateSettings(newSettings);
  };

  return {
    settings,
    updateSettings,
    getWidgetClassName,
    getLayoutClassName,
    getMobileLayoutClassName,
    moveWidgetToTaskbar,
    moveWidgetToDashboard,
    hideWidget,
    reorderWidgets,
    updateWidgetPosition,
    DEFAULT_SETTINGS,
  };
}