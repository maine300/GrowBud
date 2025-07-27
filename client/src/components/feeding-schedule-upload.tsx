import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Upload, FileText, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface FeedingScheduleUploadProps {
  onClose?: () => void;
}

export default function FeedingScheduleUpload({ onClose }: FeedingScheduleUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [scheduleName, setScheduleName] = useState("");
  const [stage, setStage] = useState("");
  const [potSize, setPotSize] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (data: { file: File; name: string; stage: string; potSize: string }) => {
      const formData = new FormData();
      formData.append("schedule", data.file);
      formData.append("name", data.name);
      formData.append("stage", data.stage);
      formData.append("potSize", data.potSize);

      const response = await fetch("/api/feeding-schedules", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) throw new Error("Failed to upload feeding schedule");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/feeding-schedules"] });
      toast({
        title: "Schedule uploaded",
        description: "Feeding schedule has been successfully uploaded and processed.",
      });
      handleReset();
      onClose?.();
    },
    onError: () => {
      toast({
        title: "Upload failed",
        description: "Failed to upload feeding schedule. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const allowedTypes = [
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/pdf',
        'text/csv'
      ];
      
      if (allowedTypes.includes(file.type)) {
        setSelectedFile(file);
      } else {
        toast({
          title: "Invalid file type",
          description: "Please upload an Excel (.xlsx, .xls), PDF, or CSV file.",
          variant: "destructive",
        });
      }
    }
  };

  const handleUpload = () => {
    if (!selectedFile || !scheduleName || !stage || !potSize) {
      toast({
        title: "Missing information",
        description: "Please fill in all fields and select a file.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate({
      file: selectedFile,
      name: scheduleName,
      stage,
      potSize,
    });
  };

  const handleReset = () => {
    setSelectedFile(null);
    setScheduleName("");
    setStage("");
    setPotSize("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="bg-gray-800 border-gray-700 w-full max-w-2xl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-semibold text-white">Upload Feeding Schedule</CardTitle>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Schedule Information */}
        <div className="space-y-4">
          <div>
            <Label htmlFor="schedule-name" className="text-gray-300">Schedule Name</Label>
            <Input
              id="schedule-name"
              placeholder="e.g., Advanced Hydroponic Schedule"
              value={scheduleName}
              onChange={(e) => setScheduleName(e.target.value)}
              className="bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:ring-plant-green-500 focus:border-transparent"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="stage" className="text-gray-300">Growth Stage</Label>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-plant-green-500 focus:border-transparent">
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seed">Seed</SelectItem>
                  <SelectItem value="seedling">Seedling</SelectItem>
                  <SelectItem value="vegetative">Vegetative</SelectItem>
                  <SelectItem value="flowering">Flowering</SelectItem>
                  <SelectItem value="harvest">Harvest</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="pot-size" className="text-gray-300">Pot Size</Label>
              <Select value={potSize} onValueChange={setPotSize}>
                <SelectTrigger className="bg-gray-700 border-gray-600 text-white focus:ring-plant-green-500 focus:border-transparent">
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="small">Small (1-3 gallons)</SelectItem>
                  <SelectItem value="medium">Medium (3-7 gallons)</SelectItem>
                  <SelectItem value="large">Large (7+ gallons)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* File Upload */}
        <div className="space-y-4">
          <Label className="text-gray-300">Upload Schedule File</Label>
          
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.pdf,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!selectedFile ? (
              <div className="space-y-4">
                <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                <div>
                  <p className="text-gray-300 mb-2">Upload your feeding schedule</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Supported formats: Excel (.xlsx, .xls), PDF, or CSV
                  </p>
                  <Button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-plant-green-600 hover:bg-plant-green-700"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    Choose File
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-center space-x-3">
                  <FileText className="w-8 h-8 text-plant-green-500" />
                  <div className="text-left">
                    <p className="text-white font-medium">{selectedFile.name}</p>
                    <p className="text-sm text-gray-400">{formatFileSize(selectedFile.size)}</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => fileInputRef.current?.click()}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Change File
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setSelectedFile(null)}
                    className="border-gray-600 text-gray-300 hover:bg-gray-700"
                  >
                    Remove
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Color-Coded Growth Stage Info */}
        <div className="bg-gray-700 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">Growth Stage Colors</h4>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
              <span className="text-gray-300">Seed</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-green-400 rounded-full"></div>
              <span className="text-gray-300">Seedling</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
              <span className="text-gray-300">Vegetative</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
              <span className="text-gray-300">Flowering</span>
            </div>
          </div>
        </div>

        {/* Upload Button */}
        <div className="flex space-x-3">
          <Button
            onClick={handleUpload}
            disabled={uploadMutation.isPending || !selectedFile || !scheduleName || !stage || !potSize}
            className="flex-1 bg-plant-green-600 hover:bg-plant-green-700"
          >
            {uploadMutation.isPending ? "Uploading..." : "Upload Schedule"}
          </Button>
          
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Reset
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}