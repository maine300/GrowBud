import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Palette } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PlantColorPickerProps {
  plantId: string;
  currentColor: string;
}

// Nice, calm color palette for plants
const PRESET_COLORS = [
  "#22c55e", // Green
  "#3b82f6", // Blue  
  "#8b5cf6", // Purple
  "#f59e0b", // Orange
  "#ef4444", // Red
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange-red
  "#6366f1", // Indigo
  "#ec4899", // Pink
  "#10b981", // Emerald
  "#8b5a2b", // Brown
];

export default function PlantColorPicker({ plantId, currentColor }: PlantColorPickerProps) {
  const [customColor, setCustomColor] = useState(currentColor);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateColorMutation = useMutation({
    mutationFn: async (color: string) => {
      const response = await fetch(`/api/plants/${plantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
      if (!response.ok) throw new Error("Failed to update plant color");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plants", plantId] });
      toast({
        title: "Color updated",
        description: "Plant color has been changed successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update plant color.",
        variant: "destructive",
      });
    },
  });

  const handleColorChange = (color: string) => {
    setCustomColor(color);
    updateColorMutation.mutate(color);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="w-8 h-8 p-0 border-2"
          style={{ backgroundColor: currentColor, borderColor: currentColor }}
        >
          <Palette className="w-4 h-4 text-white" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-64 bg-gray-800 border-gray-700">
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-white">Choose Plant Color</h4>
          
          {/* Preset Colors */}
          <div className="grid grid-cols-6 gap-2">
            {PRESET_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => handleColorChange(color)}
                className={`w-8 h-8 rounded border-2 hover:scale-110 transition-transform ${
                  currentColor === color ? "border-white" : "border-gray-600"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          {/* Custom Color Input */}
          <div className="flex items-center space-x-2">
            <Input
              type="color"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              className="w-12 h-8 p-0 border-0"
            />
            <Input
              type="text"
              value={customColor}
              onChange={(e) => setCustomColor(e.target.value)}
              placeholder="#22c55e"
              className="flex-1 bg-gray-700 border-gray-600 text-white text-xs"
            />
            <Button
              size="sm"
              onClick={() => handleColorChange(customColor)}
              className="bg-gray-600 hover:bg-gray-500 text-xs"
              disabled={updateColorMutation.isPending}
            >
              Apply
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}