import { Loader2, File, Search, Upload } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSpinner({ size = "default" }: { size?: "sm" | "default" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6", 
    lg: "w-8 h-8"
  };

  return (
    <Loader2 className={`${sizeClasses[size]} animate-spin`} />
  );
}

export function FileTreeLoading() {
  return (
    <div className="space-y-2 p-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="flex items-center space-x-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  );
}

export function CodeEditorLoading() {
  return (
    <div className="flex-1 flex flex-col">
      {/* Header skeleton */}
      <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Skeleton className="h-8 w-8" />
            <div>
              <Skeleton className="h-5 w-48 mb-2" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-8 w-20" />
            <Skeleton className="h-8 w-8" />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className="flex-1 bg-white p-4">
        <div className="space-y-2">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="flex">
              <Skeleton className="h-4 w-8 mr-4" />
              <Skeleton className="h-4 flex-1" style={{ width: `${Math.random() * 60 + 40}%` }} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function UploadProgress({ progress, fileName }: { progress: number; fileName?: string }) {
  return (
    <Card className="mx-auto max-w-md">
      <CardContent className="pt-6">
        <div className="text-center space-y-4">
          <Upload className="w-8 h-8 mx-auto text-primary animate-pulse" />
          <div>
            <p className="text-sm font-medium">Uploading...</p>
            {fileName && (
              <p className="text-xs text-muted-foreground truncate">{fileName}</p>
            )}
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{progress}% complete</p>
        </div>
      </CardContent>
    </Card>
  );
}

export function SearchLoading() {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="text-center space-y-3">
        <Search className="w-6 h-6 mx-auto text-muted-foreground animate-pulse" />
        <p className="text-sm text-muted-foreground">Searching files...</p>
      </div>
    </div>
  );
}

export function AnalysisLoading() {
  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center space-x-2">
        <LoadingSpinner size="sm" />
        <span className="text-sm">Analyzing archive...</span>
      </div>
      
      <div className="space-y-3">
        <div>
          <Skeleton className="h-4 w-32 mb-2" />
          <Skeleton className="h-2 w-full" />
        </div>
        <div>
          <Skeleton className="h-4 w-40 mb-2" />
          <Skeleton className="h-2 w-3/4" />
        </div>
        <div>
          <Skeleton className="h-4 w-36 mb-2" />
          <Skeleton className="h-2 w-1/2" />
        </div>
      </div>
    </div>
  );
}