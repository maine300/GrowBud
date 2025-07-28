import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sprout, Plus } from "lucide-react";
import type { Plant } from "@shared/schema";

interface PlantsGridProps {
  plants: Plant[];
}

export default function PlantsGrid({ plants }: PlantsGridProps) {
  const getPlantAge = (plantedDate: Date) => {
    const days = Math.floor(
      (Date.now() - new Date(plantedDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    return days;
  };

  const getHealthStatus = (age: number, stage: string) => {
    if (age < 30) return { status: "monitoring", color: "text-yellow-400" };
    if (stage === "flowering") return { status: "excellent", color: "text-plant-green-400" };
    return { status: "good", color: "text-plant-green-400" };
  };

  const getStageIcon = (stage: string) => {
    switch (stage) {
      case "seed":
        return "🌰";
      case "seedling":
        return "🌱";
      case "vegetative":
        return "🌿";
      case "flowering":
        return "🌸";
      default:
        return "🌿";
    }
  };

  return (
    <Card className="bg-gray-800 border-gray-700">
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">Active Plants</h3>
          <span className="text-sm text-gray-400">{plants.length} plants</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plants.map((plant) => {
            const age = getPlantAge(plant.plantedDate);
            const health = getHealthStatus(age, plant.stage);
            const stageIcon = getStageIcon(plant.stage);

            return (
              <Link key={plant.id} href={`/plant/${plant.id}`}>
                <Card className="bg-gray-700 hover:bg-gray-600 transition-colors duration-200 cursor-pointer border-gray-600">
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <div 
                        className="w-12 h-12 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: plant.color || "#22c55e" }}
                      >
                        <span className="text-white text-lg">{stageIcon}</span>
                      </div>
                      <div>
                        <h4 className="text-white font-semibold">{plant.name}</h4>
                        <p className="text-gray-400 text-sm">{plant.strainType}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-gray-400">Stage:</span>
                        <span className="text-white ml-1 capitalize">{plant.stage}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Location:</span>
                        <span className="text-white ml-1 capitalize">{plant.location}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Age:</span>
                        <span className="text-white ml-1">{age} days</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Health:</span>
                        <span className={`ml-1 capitalize ${health.color}`}>{health.status}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}

          {/* Add New Plant Card */}
          <Card 
            className="bg-gray-700 border-2 border-dashed border-gray-600 hover:border-plant-green-500 transition-colors duration-200 cursor-pointer"
            onClick={() => {
              const addPlantSection = document.querySelector('[data-add-plant]');
              if (addPlantSection) {
                addPlantSection.scrollIntoView({ behavior: 'smooth' });
              }
            }}
          >
            <CardContent className="p-4 flex items-center justify-center min-h-32">
              <div className="text-center">
                <Plus className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">Add New Plant</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Card>
  );
}
