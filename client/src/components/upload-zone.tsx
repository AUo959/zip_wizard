import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { CloudUpload, CheckCircle, AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface UploadZoneProps {
  onUploadSuccess: () => void;
}

export default function UploadZone({ onUploadSuccess }: UploadZoneProps) {
  const [uploadProgress, setUploadProgress] = useState(0);
  const { toast } = useToast();

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("archive", file);

      // Simulate progress updates
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      try {
        const response = await apiRequest("POST", "archives", formData);
        clearInterval(progressInterval);
        setUploadProgress(100);
        return await response.json();
      } catch (error) {
        clearInterval(progressInterval);
        throw error;
      }
    },
    onSuccess: (data) => {
      toast({
        title: "Upload successful",
        description: `Processed ${data.fileCount} files from ${data.archive.name}`,
      });
      setTimeout(() => {
        setUploadProgress(0);
        onUploadSuccess();
      }, 1000);
    },
    onError: (error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
      setUploadProgress(0);
    },
  });

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      uploadMutation.mutate(file);
    }
  }, [uploadMutation]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/zip': ['.zip'],
      'application/x-rar-compressed': ['.rar'],
      'application/x-7z-compressed': ['.7z'],
    },
    maxFiles: 1,
  });

  if (uploadMutation.isPending) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="p-8">
            <div className="text-center space-y-6">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                  <span className="text-sm">Archive extracted</span>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm">Analyzing code structure...</span>
                </div>
                <div className="flex items-center space-x-3 opacity-50">
                  <div className="w-4 h-4 rounded-full bg-gray-300" />
                  <span className="text-sm">Generating descriptions</span>
                </div>
                <div className="flex items-center space-x-3 opacity-50">
                  <div className="w-4 h-4 rounded-full bg-gray-300" />
                  <span className="text-sm">Building search index</span>
                </div>
              </div>

              <div className="space-y-2">
                <Progress value={uploadProgress} className="w-full" />
                <p className="text-xs text-gray-500">Processing files...</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Upload Your Code Archive
        </h2>
        <p className="text-lg text-gray-600">
          Drag and drop a zip file to analyze and organize your codebase
        </p>
      </div>

      <Card>
        <CardContent className="p-8">
          <div
            {...getRootProps()}
            className={`upload-zone border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-all ${
              isDragActive
                ? "border-blue-600 bg-blue-50"
                : "border-gray-300 hover:border-blue-500 hover:bg-blue-50"
            }`}
          >
            <input {...getInputProps()} />
            <CloudUpload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <div>
                <p className="text-lg font-medium text-blue-600 mb-2">
                  Drop the archive here
                </p>
                <p className="text-sm text-gray-500">
                  Release to start processing
                </p>
              </div>
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Drop zip files here
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  or click to browse
                </p>
                <Button variant="outline">
                  Choose File
                </Button>
              </div>
            )}
          </div>

          <div className="mt-6 text-center text-sm text-gray-500">
            <p>Supported formats: ZIP, RAR, 7Z • Max file size: 100MB</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
