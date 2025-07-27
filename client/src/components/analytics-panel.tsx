import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, RotateCcw, HardDrive } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Plant, Backup } from "@shared/schema";

interface AnalyticsPanelProps {
  plants: Plant[];
}

export default function AnalyticsPanel({ plants }: AnalyticsPanelProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: backups = [] } = useQuery<Backup[]>({
    queryKey: ["/api/backups"],
  });

  const createBackupMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/backups", {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to create backup");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      toast({
        title: "Backup created",
        description: "Manual backup has been successfully created.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create backup.",
        variant: "destructive",
      });
    },
  });

  const getAnalytics = () => {
    const totalPlants = plants.length;
    const activeFlowering = plants.filter(p => p.stage === "flowering").length;
    const averageAge = plants.length > 0 
      ? Math.round(plants.reduce((sum, plant) => {
          const age = Math.floor((Date.now() - new Date(plant.plantedDate).getTime()) / (1000 * 60 * 60 * 24));
          return sum + age;
        }, 0) / plants.length)
      : 0;

    const estimatedHarvest = plants
      .filter(p => p.stage === "flowering")
      .map(plant => {
        const plantedDate = new Date(plant.plantedDate);
        const harvestDate = new Date(plantedDate);
        harvestDate.setDate(harvestDate.getDate() + 120); // Estimated 120 days total
        return harvestDate;
      })
      .sort((a, b) => a.getTime() - b.getTime())[0];

    return {
      totalPlants,
      activeFlowering,
      averageAge,
      growthRate: "2.3 cm/week",
      harvestDate: estimatedHarvest 
        ? estimatedHarvest.toLocaleDateString('default', { month: 'long', day: 'numeric', year: 'numeric' })
        : "No flowering plants",
      yieldEstimate: `${activeFlowering * 150}g`,
    };
  };

  const analytics = getAnalytics();
  const lastBackup = backups[0];

  return (
    <div className="space-y-6">
      {/* Growth Analytics */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Growth Analytics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total Plants</span>
            <span className="text-white font-medium">{analytics.totalPlants}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Flowering Plants</span>
            <span className="text-white font-medium">{analytics.activeFlowering}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Average Age</span>
            <span className="text-white font-medium">{analytics.averageAge} days</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Average Growth Rate</span>
            <span className="text-white font-medium">{analytics.growthRate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Next Harvest</span>
            <span className="text-plant-green-400 font-medium">{analytics.harvestDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-400">Total Yield Estimate</span>
            <span className="text-white font-medium">{analytics.yieldEstimate}</span>
          </div>

          {/* Growth Chart Placeholder */}
          <div className="mt-6 h-32 bg-gray-700 rounded-lg flex items-center justify-center">
            <span className="text-gray-400 text-sm">Growth Chart</span>
          </div>
        </CardContent>
      </Card>

      {/* Backup and Recovery */}
      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-white flex items-center">
            <HardDrive className="w-5 h-5 mr-2" />
            Backup & Recovery
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Auto Backup</p>
              <p className="text-gray-400 text-sm">Daily at 2:00 AM</p>
            </div>
            <div className="w-3 h-3 bg-plant-green-500 rounded-full"></div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <p className="text-white font-medium">Last Backup</p>
              <p className="text-gray-400 text-sm">
                {lastBackup 
                  ? new Date(lastBackup.createdAt).toLocaleDateString('default', { 
                      month: 'short', 
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })
                  : "No backups yet"
                }
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-plant-green-400 hover:text-plant-green-300"
            >
              View All ({backups.length})
            </Button>
          </div>

          <div className="pt-4 border-t border-gray-700 space-y-2">
            <Button
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium"
              onClick={() => createBackupMutation.mutate()}
              disabled={createBackupMutation.isPending}
            >
              <Download className="w-4 h-4 mr-2" />
              {createBackupMutation.isPending ? "Creating..." : "Create Manual Backup"}
            </Button>
            <Button
              variant="outline"
              className="w-full border-gray-600 text-gray-300 hover:bg-gray-700"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Restore from Backup
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
