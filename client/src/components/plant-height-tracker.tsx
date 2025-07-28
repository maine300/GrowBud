import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Ruler, TrendingUp, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Plant } from "@shared/schema";

interface PlantHeightTrackerProps {
  plant: Plant;
}

export default function PlantHeightTracker({ plant }: PlantHeightTrackerProps) {
  const [height, setHeight] = useState(plant.currentHeight?.toString() || "");
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const updateHeightMutation = useMutation({
    mutationFn: async (newHeight: number) => {
      const response = await fetch(`/api/plants/${plant.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ currentHeight: newHeight }),
      });
      if (!response.ok) throw new Error("Failed to update height");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plants", plant.id] });
      toast({
        title: "Height Updated",
        description: "Plant height has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update plant height.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numHeight = parseInt(height);
    if (isNaN(numHeight) || numHeight < 0) {
      toast({
        title: "Invalid Height",
        description: "Please enter a valid height in centimeters.",
        variant: "destructive",
      });
      return;
    }
    updateHeightMutation.mutate(numHeight);
  };

  // Calculate growth insights based on height and stage
  const getGrowthInsights = () => {
    const currentHeight = plant.currentHeight || 0;
    const plantAge = Math.floor(
      (Date.now() - new Date(plant.plantedDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    // Expected height ranges by stage (cm)
    const heightRanges = {
      seed: { min: 0, max: 5, ideal: "0-5" },
      seedling: { min: 5, max: 20, ideal: "5-20" },
      vegetative: { min: 20, max: 100, ideal: "30-80" },
      flowering: { min: 50, max: 150, ideal: "60-120" },
      harvest: { min: 60, max: 200, ideal: "80-150" }
    };

    const expectedRange = heightRanges[plant.stage as keyof typeof heightRanges] || heightRanges.vegetative;
    
    let status: "good" | "low" | "high" = "good";
    let recommendation = "";

    if (currentHeight < expectedRange.min) {
      status = "low";
      recommendation = "Plant may be stunted. Check nutrients, light, and environmental conditions.";
    } else if (currentHeight > expectedRange.max) {
      status = "high";
      recommendation = "Plant is growing very tall. Consider LST or SCROG techniques to control height.";
    } else {
      recommendation = "Plant height is within normal range for this stage.";
    }

    // Stage transition recommendations based on height
    let stageRecommendation = "";
    if (plant.stage === "seedling" && currentHeight >= 15) {
      stageRecommendation = "Plant height suggests it may be ready for vegetative stage.";
    } else if (plant.stage === "vegetative" && currentHeight >= 50) {
      stageRecommendation = "Plant height suggests it could handle flowering stage transition.";
    }

    return {
      status,
      recommendation,
      stageRecommendation,
      expectedRange: expectedRange.ideal,
      growthRate: plantAge > 0 ? (currentHeight / plantAge).toFixed(1) : "0"
    };
  };

  const insights = getGrowthInsights();
  const currentHeight = plant.currentHeight || 0;

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <CardTitle className="text-xl font-semibold text-white flex items-center">
          <Ruler className="w-5 h-5 mr-2" />
          Height Tracking
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Current Height Display */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Current Height</span>
          <div className="flex items-center space-x-2">
            <span className="text-2xl font-bold text-white">{currentHeight}</span>
            <span className="text-gray-400">cm</span>
            <Badge 
              variant={insights.status === "good" ? "default" : insights.status === "low" ? "secondary" : "destructive"}
              className={
                insights.status === "good" ? "bg-plant-green-600" :
                insights.status === "low" ? "bg-yellow-600" : "bg-red-600"
              }
            >
              {insights.status}
            </Badge>
          </div>
        </div>

        {/* Expected Range */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Expected for {plant.stage}</span>
          <span className="text-white">{insights.expectedRange} cm</span>
        </div>

        {/* Growth Rate */}
        <div className="flex items-center justify-between">
          <span className="text-gray-400">Growth Rate</span>
          <div className="flex items-center space-x-1">
            <TrendingUp className="w-4 h-4 text-plant-green-400" />
            <span className="text-white">{insights.growthRate} cm/day</span>
          </div>
        </div>

        {/* Update Height Form */}
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            type="number"
            placeholder="Height in cm"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="bg-gray-700 border-gray-600 text-white flex-1"
            min="0"
            max="300"
          />
          <Button
            type="submit"
            disabled={updateHeightMutation.isPending}
            className="bg-plant-green-600 hover:bg-plant-green-700"
          >
            {updateHeightMutation.isPending ? "Updating..." : "Update"}
          </Button>
        </form>

        {/* Insights and Recommendations */}
        <div className="space-y-2 pt-2 border-t border-gray-700">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-gray-300">{insights.recommendation}</p>
          </div>
          
          {insights.stageRecommendation && (
            <div className="flex items-start space-x-2">
              <TrendingUp className="w-4 h-4 text-plant-green-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-plant-green-300">{insights.stageRecommendation}</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}