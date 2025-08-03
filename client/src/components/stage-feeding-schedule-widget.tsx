import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { fullNutrientPresets } from "@/lib/fullNutrientPresets";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface Props {
  plantStage: string;
  potSize: number;
  nutrientBrand?: string;
}

export default function StageFeedingScheduleWidget({
  plantStage,
  potSize,
  nutrientBrand = "Fox Farm",
}: Props) {
  const [selectedSize, setSelectedSize] = useState<number>(Number(potSize));
  const stagePresets = fullNutrientPresets[nutrientBrand]?.[plantStage];

  if (!stagePresets) {
    return (
      <Card className="bg-gray-800 border-gray-700 mb-8">
        <CardHeader>
          <CardTitle className="text-white">Full Feeding Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-400">
            No data available for this stage and brand.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gray-800 border-gray-700 mb-8">
      <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-white mb-2 md:mb-0">
          Full Feeding Schedule ({nutrientBrand}, {plantStage}, {selectedSize}{" "}
          gal)
        </CardTitle>
        <div className="flex items-center gap-2">
          <Label htmlFor="potSize" className="text-white text-sm">
            Pot Size
          </Label>
          <Select
            value={selectedSize.toString()}
            onValueChange={(val) => setSelectedSize(Number(val))}
          >
            <SelectTrigger className="w-[100px] bg-gray-700 text-white border-gray-600">
              <SelectValue placeholder="Size" />
            </SelectTrigger>
            <SelectContent className="bg-gray-800 text-white border-gray-600">
              <SelectItem value="5">5 gal</SelectItem>
              <SelectItem value="10">10 gal</SelectItem>
              <SelectItem value="15">15 gal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        {Object.entries(stagePresets).map(([week, nutrients]) => (
          <div key={week} className="mb-4">
            <h4 className="text-lg text-plant-green-500 font-bold">
              Week {week}
            </h4>
            <ul className="ml-4 list-disc text-white text-sm">
              {Object.entries(nutrients[selectedSize] || {}).map(
                ([nutrient, amount]) => (
                  <li key={nutrient}>
                    {nutrient}: {amount}
                  </li>
                ),
              )}
            </ul>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
