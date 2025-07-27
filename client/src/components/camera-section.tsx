import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Photo } from "@shared/schema";

interface CameraSectionProps {
  plantId?: string;
  photos?: Photo[];
}

export default function CameraSection({ plantId, photos = [] }: CameraSectionProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadPhotoMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!plantId) throw new Error("Plant ID is required");
      
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("plantId", plantId);

      const response = await fetch("/api/photos", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Failed to upload photo");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
      toast({
        title: "Photo uploaded",
        description: "Photo has been successfully uploaded.",
      });
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload photo. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadPhotoMutation.mutate(file);
    }
  };

  const latestPhoto = photos.sort((a, b) => 
    new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime()
  )[0];

  const photoHistory = photos
    .sort((a, b) => new Date(b.capturedAt).getTime() - new Date(a.capturedAt).getTime())
    .slice(1, 6);

  return (
    <Card className="bg-gray-800 border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-white">Live Camera</CardTitle>
          <div className="flex space-x-2">
            <Button
              size="sm"
              className="bg-plant-green-600 hover:bg-plant-green-700"
              onClick={() => fileInputRef.current?.click()}
              disabled={!plantId || uploadPhotoMutation.isPending}
            >
              <Upload className="w-4 h-4 mr-2" />
              Upload
            </Button>
            <Button
              size="sm"
              className="bg-plant-green-600 hover:bg-plant-green-700"
              disabled={!plantId}
            >
              <Camera className="w-4 h-4 mr-2" />
              Capture
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          className="hidden"
        />

        {/* Main Photo Display */}
        <div className="mb-4">
          {latestPhoto ? (
            <img
              src={selectedPhoto || `/api/photos/${latestPhoto.id}/file`}
              alt="Latest plant photo"
              className="w-full h-48 object-cover rounded-lg border border-gray-600"
            />
          ) : (
            <div className="w-full h-48 bg-gray-700 rounded-lg border border-gray-600 flex items-center justify-center">
              <div className="text-center">
                <Camera className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-400 text-sm">No photos available</p>
              </div>
            </div>
          )}
        </div>

        {/* Photo History Thumbnails */}
        {photoHistory.length > 0 && (
          <div className="flex space-x-2 overflow-x-auto pb-2">
            {photoHistory.map((photo) => (
              <img
                key={photo.id}
                src={`/api/photos/${photo.id}/file`}
                alt="Photo history"
                className="w-16 h-16 object-cover rounded cursor-pointer border border-gray-600 hover:border-plant-green-500 transition-colors flex-shrink-0"
                onClick={() => setSelectedPhoto(`/api/photos/${photo.id}/file`)}
              />
            ))}
          </div>
        )}

        {uploadPhotoMutation.isPending && (
          <div className="text-center text-gray-400 text-sm mt-2">
            Uploading photo...
          </div>
        )}
      </CardContent>
    </Card>
  );
}
