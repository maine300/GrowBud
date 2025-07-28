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

export function useDashboardSettings() {
  const [settings, setSettings] = useState<DashboardSettings>(() => {
    try {
      const saved = localStorage.getItem("dashboard-settings");
      return saved ? JSON.parse(saved) : DEFAULT_SETTINGS;
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
    
    let className = "";
    
    // Size classes
    switch (size) {
      case "small":
        className += isCompact ? "h-32" : "h-40";
        break;
      case "medium":
        className += isCompact ? "h-48" : "h-56";
        break;
      case "large":
        className += isCompact ? "h-64" : "h-80";
        break;
    }
    
    // Layout specific classes
    if (settings.layout === "compact") {
      className += " col-span-1";
    } else if (settings.layout === "masonry") {
      className += size === "large" ? " col-span-2" : " col-span-1";
    } else {
      // Grid layout
      if (widget === "plants") {
        className += " md:col-span-2 lg:col-span-3";
      } else if (widget === "environment") {
        className += " md:col-span-3";
      } else {
        className += " col-span-1";
      }
    }
    
    // Grid lines
    if (settings.showGridLines) {
      className += " border border-gray-600";
    }
    
    return className;
  };

  const getLayoutClassName = () => {
    switch (settings.layout) {
      case "compact":
        return "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4";
      case "masonry":
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
      default:
        return "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6";
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