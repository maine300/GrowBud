import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Calendar, BarChart3, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import CameraSection from "@/components/camera-section";
import CareCalendar from "@/components/care-calendar";
import FeedingScheduleUpload from "@/components/feeding-schedule-upload";
import PlantColorPicker from "@/components/plant-color-picker";
import DeviceControlsPlant from "@/components/device-controls-plant";
import SensorDataPlant from "@/components/sensor-data-plant";
import PlantHeightTracker from "@/components/plant-height-tracker";
import { useToast } from "@/hooks/use-toast";
import type { Plant, Photo, CalendarEvent } from "@shared/schema";
import StageFeedingScheduleWidget from "@/components/stage-feeding-schedule-widget";
import AutoDeviceTrigger from "@/components/AutoDeviceTrigger";

export default function PlantDetail() {
  const { plantId } = useParams();
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showFeedingUpload, setShowFeedingUpload] = useState(false);

  const { data: devices = [] } = useQuery({
    queryKey: ["devices"],
    queryFn: async () => {
      const res = await fetch("/api/devices");
      return res.json();
    },
  });

  const stageMap: Record<string, string> = {
    veg: "vegetative",
    flower: "flowering",
    seed: "seed",
    vegetative: "vegetative",
    flowering: "flowering",
  };

  const { data: plant, isLoading: plantLoading } = useQuery<Plant>({
    queryKey: ["/api/plants", id],
  });

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
    select: (data) => data.filter((photo) => photo.plantId === id),
  });

  const { data: calendarEvents = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events"],
    select: (data) => data.filter((event) => event.plantId === id),
  });

  const { data: sensorDataList = [] } = useQuery({
    queryKey: ["/api/sensor-data"],
  });

  const sensorData = plant
    ? sensorDataList
        .filter((d: any) => d.plantId === plant.id)
        .sort(
          (a: any, b: any) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )[0]
    : null;

  const deletePlantMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/plants/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete plant");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      toast({
        title: "Plant deleted",
        description: "Plant has been successfully removed.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete plant.",
        variant: "destructive",
      });
    },
  });

  const flipStageMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`/api/plants/${id}/flip-stage`, {
        method: "POST",
      });
      if (!response.ok) throw new Error("Failed to flip plant stage");
      return response.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/plants"] });
      queryClient.invalidateQueries({ queryKey: ["/api/plants", id] });
      queryClient.invalidateQueries({ queryKey: ["/api/calendar-events"] });
      toast({
        title: "Stage Advanced",
        description: data.message || "Plant stage advanced successfully!",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to advance plant stage.",
        variant: "destructive",
      });
    },
  });

  if (plantLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white">Loading plant details...</div>
      </div>
    );
  }

  if (!plant) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">
            Plant not found
          </h2>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const latestPhoto = photos.sort(
    (a, b) =>
      new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
  )[0];

  const photoHistory = photos
    .sort(
      (a, b) =>
        new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime(),
    )
    .slice(1, 6);

  const plantAge = Math.floor(
    (Date.now() - new Date(plant.plantedDate).getTime()) /
      (1000 * 60 * 60 * 24),
  );

  const todaysTasks = calendarEvents.filter((event) => {
    const today = new Date().toISOString().split("T")[0];
    return event.date === today && !event.completed;
  });

  const getNextStage = (currentStage: string) => {
    const stages = ["seed", "vegetative", "flowering", "harvest"];
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex === -1 || currentIndex === stages.length - 1)
      return currentStage;
    return stages[currentIndex + 1];
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link href="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-3xl font-bold text-white">{plant.name}</h1>
                <div className="flex items-center space-x-4 mt-2">
                  <Badge variant="secondary">{plant.strainType}</Badge>
                  <Badge variant="outline">{plant.location}</Badge>
                  <Badge
                    variant={
                      plant.stage === "flowering" ? "default" : "secondary"
                    }
                    className={
                      plant.stage === "flowering" ? "bg-plant-green-600" : ""
                    }
                  >
                    {plant.stage}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <PlantColorPicker
                plantId={plant.id}
                currentColor={plant.color || "#22c55e"}
              />
              {plant.stage !== "harvest" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => flipStageMutation.mutate()}
                  disabled={flipStageMutation.isPending}
                  className="bg-plant-green-600 hover:bg-plant-green-700 border-plant-green-500 text-white"
                >
                  {flipStageMutation.isPending
                    ? "Advancing..."
                    : `Flip to ${getNextStage(plant.stage)}`}
                </Button>
              )}
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deletePlantMutation.mutate()}
                disabled={deletePlantMutation.isPending}
              >
                Delete Plant
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Plant Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Age
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {plantAge} days
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Photos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {photos.length}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">
                Tasks Today
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {todaysTasks.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Section */}
        <div className="mb-8">
          <CameraSection plantId={plant.id} photos={photos} />
        </div>

        <StageFeedingScheduleWidget
          plantStage={stageMap[plant.stage] || plant.stage}
          potSize={plant.potSize}
          nutrientBrand={plant.nutrientBrand || "Fox Farm"}
        />

        {/* Calendar Section - Full Width */}
        <div className="mb-8 h-[48rem]">
          <CareCalendar plantId={plant.id} />
        </div>

        {/* Device Controls and Sensors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="space-y-6">
            <PlantHeightTracker plant={plant} />
            <DeviceControlsPlant plantId={plant.id} plant={plant} />
          </div>
          <SensorDataPlant plantId={plant.id} plant={plant} />
        </div>

        {/* Feeding Schedule Upload */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-lg font-semibold text-white flex items-center">
              <Upload className="w-5 h-5 mr-2" />
              Feeding Schedules
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Dialog
              open={showFeedingUpload}
              onOpenChange={setShowFeedingUpload}
            >
              <DialogTrigger asChild>
                <Button
                  className="w-full bg-plant-green-600 hover:bg-plant-green-700"
                  onClick={() => setShowFeedingUpload(true)}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  Upload Schedule
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Upload Feeding Schedule</DialogTitle>
                </DialogHeader>
                <FeedingScheduleUpload
                  onClose={() => setShowFeedingUpload(false)}
                />
              </DialogContent>
            </Dialog>

            <p className="text-sm text-gray-400 mt-2">
              Upload Excel, PDF, or CSV feeding schedules with color-coded
              growth stages
            </p>
          </CardContent>
        </Card>

        {/* Today's Tasks */}
        {todaysTasks.length > 0 && (
          <Card className="bg-gray-800 border-gray-700 mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="w-5 h-5 mr-2" />
                Today's Tasks
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {todaysTasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg"
                  >
                    <input
                      type="checkbox"
                      className="w-4 h-4 text-plant-green-600 rounded focus:ring-plant-green-500"
                    />
                    <span className="text-white">{task.task}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Photo History */}
        {photoHistory.length > 0 && (
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Camera className="w-5 h-5 mr-2" />
                Photo History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {photoHistory.map((photo) => (
                  <div key={photo.id} className="aspect-square">
                    <img
                      src={`/api/photos/${photo.id}/file`}
                      alt="Plant photo"
                      className="w-full h-full object-cover rounded-lg border border-gray-600 hover:border-plant-green-500 transition-colors cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {sensorData && devices && (
          <AutoDeviceTrigger
            plant={plant}
            sensorData={{
              temperature: sensorData.temperature,
              humidity: sensorData.humidity,
              soilMoisture: sensorData.soilMoisture,
            }}
            devices={devices}
          />
        )}
      </div>
    </div>
  );
}
