import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, Droplets, Sprout, Gauge } from "lucide-react";

interface EnvironmentCardProps {
  title: string;
  value: number;
  unit: string;
  status: string;
  icon: "temperature" | "humidity" | "soil" | "pressure";
  iconColor: string;
}

const iconComponents = {
  temperature: Thermometer,
  humidity: Droplets,
  soil: Sprout,
  pressure: Gauge,
};

export default function EnvironmentCard({
  title,
  value,
  unit,
  status,
  icon,
  iconColor,
}: EnvironmentCardProps) {
  const IconComponent = iconComponents[icon];
  
  const getStatusColor = (status: string, value: number) => {
    if (status.includes("Needs watering") || status.includes("Low")) {
      return "text-amber-400";
    }
    if (status.includes("Optimal") || status.includes("Good") || status.includes("Excellent")) {
      return "text-plant-green-400";
    }
    return "text-gray-400";
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <CardTitle className="text-lg font-semibold text-white">{title}</CardTitle>
          <div className={`w-10 h-10 ${iconColor} rounded-lg flex items-center justify-center`}>
            <IconComponent className="w-5 h-5 text-white" />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <span className="text-3xl font-bold text-white">
            {typeof value === 'number' ? value.toFixed(1) : '0.0'}
          </span>
          <span className="text-lg text-gray-400">{unit}</span>
        </div>
        <p className={`text-sm mt-2 ${getStatusColor(status, value)}`}>
          {status}
        </p>
      </CardContent>
    </Card>
  );
}
