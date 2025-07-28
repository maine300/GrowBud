import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Camera, Play, Pause, Download, Clock } from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface CameraControlsProps {
  plantId: string;
  deviceGroup: string;
}

export const CameraControls: React.FC<CameraControlsProps> = ({ plantId, deviceGroup }) => {
  const [isCapturing, setIsCapturing] = useState(false);
  const [timelapseStatus, setTimelapseStatus] = useState<'stopped' | 'recording'>('stopped');
  const { toast } = useToast();

  const triggerManualCapture = async () => {
    setIsCapturing(true);
    try {
      await apiRequest(`/api/camera/trigger/${deviceGroup}`, {
        method: 'POST',
      });
      
      toast({
        title: "Photo Capture Triggered",
        description: "ESP32-CAM will capture a photo within 30 seconds",
      });
    } catch (error) {
      toast({
        title: "Capture Failed", 
        description: "Could not trigger camera capture",
        variant: "destructive",
      });
    } finally {
      setIsCapturing(false);
    }
  };

  const toggleTimelapse = async () => {
    const newStatus = timelapseStatus === 'stopped' ? 'recording' : 'stopped';
    setTimelapseStatus(newStatus);
    
    toast({
      title: newStatus === 'recording' ? "Time-lapse Started" : "Time-lapse Stopped",
      description: newStatus === 'recording' 
        ? "Capturing photos every hour for time-lapse" 
        : "Time-lapse recording stopped",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Camera Controls
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Manual Capture */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Manual Photo</h4>
            <p className="text-sm text-muted-foreground">
              Trigger ESP32-CAM to take a photo now
            </p>
          </div>
          <Button 
            onClick={triggerManualCapture}
            disabled={isCapturing}
            size="sm"
          >
            <Camera className="h-4 w-4 mr-2" />
            {isCapturing ? 'Capturing...' : 'Capture'}
          </Button>
        </div>

        {/* Time-lapse Control */}
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium">Time-lapse</h4>
            <p className="text-sm text-muted-foreground">
              Automatic hourly photos for growth tracking
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={timelapseStatus === 'recording' ? 'default' : 'secondary'}>
              {timelapseStatus === 'recording' ? 'Recording' : 'Stopped'}
            </Badge>
            <Button 
              onClick={toggleTimelapse}
              variant={timelapseStatus === 'recording' ? 'destructive' : 'default'}
              size="sm"
            >
              {timelapseStatus === 'recording' ? (
                <>
                  <Pause className="h-4 w-4 mr-2" />
                  Stop
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Camera Status */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Camera Status:</span>
            <Badge variant="outline" className="text-green-600">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              ESP32-CAM Online
            </Badge>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Last Photo:</span>
            <div className="flex items-center gap-1 text-xs">
              <Clock className="h-3 w-3" />
              2 minutes ago
            </div>
          </div>
          <div className="flex items-center justify-between text-sm mt-2">
            <span className="text-muted-foreground">Resolution:</span>
            <span className="text-xs">1600×1200</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" size="sm" className="text-xs">
            <Download className="h-3 w-3 mr-1" />
            Export Photos
          </Button>
          <Button variant="outline" size="sm" className="text-xs">
            <Play className="h-3 w-3 mr-1" />
            Create Video
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

interface CameraStreamProps {
  deviceGroup: string;
  streamUrl?: string;
}

export const CameraStream: React.FC<CameraStreamProps> = ({ deviceGroup, streamUrl }) => {
  const [isStreaming, setIsStreaming] = useState(false);

  if (!streamUrl) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Live Camera Feed
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p className="text-sm">ESP32-CAM Stream</p>
              <p className="text-xs">Photos available in gallery below</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Live Camera Feed
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="aspect-video bg-black rounded-lg overflow-hidden">
          <img 
            src={streamUrl}
            alt="Live camera feed"
            className="w-full h-full object-cover"
            onLoad={() => setIsStreaming(true)}
            onError={() => setIsStreaming(false)}
          />
          {!isStreaming && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center text-white">
                <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p className="text-sm">Connecting to camera...</p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

interface CameraPhotoGalleryProps {
  photos: Array<{
    id: string;
    filename: string;
    filepath: string;
    caption?: string;
    createdAt: string;
  }>;
}

export const CameraPhotoGallery: React.FC<CameraPhotoGalleryProps> = ({ photos }) => {
  const cameraPhotos = photos.filter(photo => 
    photo.caption?.includes('ESP32-CAM') || photo.filename.includes('camera_')
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Camera Photos
          <Badge variant="secondary">{cameraPhotos.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {cameraPhotos.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Camera className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p>No camera photos yet</p>
            <p className="text-sm">Photos will appear here once ESP32-CAM starts capturing</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {cameraPhotos.map((photo) => (
              <div key={photo.id} className="group relative">
                <div className="aspect-square bg-muted rounded-lg overflow-hidden">
                  <img
                    src={photo.filepath}
                    alt={photo.caption || 'Camera photo'}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                  />
                </div>
                <div className="absolute bottom-0 left-0 right-0 bg-black/75 text-white p-2 text-xs">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {new Date(photo.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};