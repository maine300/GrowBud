export interface SensorDataDisplay {
  temperature: number;
  humidity: number;
  soilMoisture: number;
  lastUpdated: Date;
}

export interface CalendarDay {
  day: number;
  date: string;
  tasks: string[];
  isCurrentMonth: boolean;
  isToday: boolean;
}

export interface PlantStats {
  age: number;
  health: 'excellent' | 'good' | 'monitoring' | 'poor';
  lastWatered: Date | null;
  nextTask: string | null;
}

export interface Analytics {
  growthRate: string;
  harvestDate: string;
  yieldEstimate: string;
  totalPlants: number;
}

export interface BackupStatus {
  lastBackup: Date | null;
  autoBackupEnabled: boolean;
  totalBackups: number;
}
