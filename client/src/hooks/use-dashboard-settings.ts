import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

export interface DashboardSettings {
  layout: "grid" | "masonry" | "compact";
  widgetSizes: {
    environment: "small" | "medium" | "large";
    plants: "small" | "medium" | "large";
    calendar: "small" | "medium" | "large";
    controls: "small" | "medium" | "large";
    analytics: "small" | "medium" | "large";
  };
  widgetOrder: string[]; // Array of widget names in display order
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
    calendar: "large", // Make calendar bigger by default
    controls: "small",
    analytics: "medium",
  },
  widgetOrder: ["environment", "plants", "calendar", "controls", "analytics"],
  theme: "dark",
  compactMode: false,
  showGridLines: false,
  refreshInterval: 5,
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
    
    let className = "bg-gray-800 rounded-lg p-6 ";
    
    // Size classes - fixed heights to prevent overflow, calendar gets extra height
    switch (size) {
      case "small":
        className += widget === "calendar" 
          ? (isCompact ? "h-80" : "h-96") 
          : (isCompact ? "h-48" : "h-56");
        break;
      case "medium":
        className += widget === "calendar" 
          ? (isCompact ? "h-[32rem]" : "h-[40rem]") 
          : (isCompact ? "h-64" : "h-72");
        break;
      case "large":
        className += widget === "calendar" 
          ? (isCompact ? "h-[40rem]" : "h-[48rem]") 
          : (isCompact ? "h-80" : "h-96");
        break;
    }
    
    // Layout specific classes - calendar gets more space
    if (settings.layout === "compact") {
      className += widget === "calendar" ? " col-span-2" : " col-span-1";
    } else if (settings.layout === "masonry") {
      if (widget === "calendar") {
        className += " col-span-2 lg:col-span-3";
      } else {
        className += size === "large" ? " col-span-2" : " col-span-1";
      }
    } else {
      // Grid layout - proper responsive columns
      if (widget === "plants") {
        className += " col-span-1 md:col-span-2";
      } else if (widget === "environment") {
        className += " col-span-1 md:col-span-2 lg:col-span-3";
      } else if (widget === "calendar") {
        className += " col-span-1 md:col-span-2 lg:col-span-2";
      } else {
        className += " col-span-1";
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
    const baseClass = "grid gap-6 min-h-0 auto-rows-min ";
    
    switch (settings.layout) {
      case "compact":
        return baseClass + "grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4";
      case "masonry":
        return baseClass + "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
      default:
        return baseClass + "grid-cols-1 md:grid-cols-2 lg:grid-cols-3";
    }
  };

  return {
    settings,
    updateSettings,
    getWidgetClassName,
    getLayoutClassName,
    DEFAULT_SETTINGS,
  };
}