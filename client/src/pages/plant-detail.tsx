import { useState } from "react";
import { useParams, Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Camera, Calendar, BarChart3, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import CameraSection from "@/components/camera-section";
import CareCalendar from "@/components/care-calendar";
import FeedingScheduleUpload from "@/components/feeding-schedule-upload";
import PlantColorPicker from "@/components/plant-color-picker";
import { useToast } from "@/hooks/use-toast";
import type { Plant, Photo, CalendarEvent } from "@shared/schema";

export default function PlantDetail() {
  const { id } = useParams();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showFeedingUpload, setShowFeedingUpload] = useState(false);

  const { data: plant, isLoading: plantLoading } = useQuery<Plant>({
    queryKey: ["/api/plants", id],
  });

  const { data: photos = [] } = useQuery<Photo[]>({
    queryKey: ["/api/photos"],
    select: (data) => data.filter(photo => photo.plantId === id),
  });

  const { data: calendarEvents = [] } = useQuery<CalendarEvent[]>({
    queryKey: ["/api/calendar-events"],
    select: (data) => data.filter(event => event.plantId === id),
  });

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
          <h2 className="text-2xl font-bold text-white mb-4">Plant not found</h2>
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

  const latestPhoto = photos.sort((a, b) => 
    new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  )[0];

  const photoHistory = photos
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
    .slice(1, 6);

  const plantAge = Math.floor(
    (Date.now() - new Date(plant.plantedDate).getTime()) / (1000 * 60 * 60 * 24)
  );

  const todaysTasks = calendarEvents.filter(event => {
    const today = new Date().toISOString().split('T')[0];
    return event.date === today && !event.completed;
  });

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
                    variant={plant.stage === 'flowering' ? 'default' : 'secondary'}
                    className={plant.stage === 'flowering' ? 'bg-plant-green-600' : ''}
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
              <CardTitle className="text-sm font-medium text-gray-400">Age</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{plantAge} days</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Photos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{photos.length}</div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-400">Tasks Today</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{todaysTasks.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Section */}
        <div className="mb-8">
          <CameraSection plantId={plant.id} photos={photos} />
        </div>

        {/* Calendar Section - Full Width */}
        <div className="mb-8 h-[48rem]">
          <CareCalendar plantId={plant.id} />
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
            <Dialog open={showFeedingUpload} onOpenChange={setShowFeedingUpload}>
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
                <FeedingScheduleUpload onClose={() => setShowFeedingUpload(false)} />
              </DialogContent>
            </Dialog>
            
            <p className="text-sm text-gray-400 mt-2">
              Upload Excel, PDF, or CSV feeding schedules with color-coded growth stages
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
                  <div key={task.id} className="flex items-center space-x-3 p-3 bg-gray-700 rounded-lg">
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
      </div>
    </div>
  );
}
