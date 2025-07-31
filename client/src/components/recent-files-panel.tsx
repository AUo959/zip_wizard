import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, File as FileIcon } from "lucide-react";
import { formatFileSize } from "@/lib/file-utils";
import { cn } from "@/lib/utils";
import type { File } from "@shared/schema";

interface RecentFilesPanelProps {
  recentFiles: File[];
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
}

export function RecentFilesPanel({ recentFiles, selectedFile, onFileSelect }: RecentFilesPanelProps) {
  if (recentFiles.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Recent Files</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground text-sm py-8">
            <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No recent files</p>
            <p className="text-xs">Files you open will appear here</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Recent Files</span>
          </div>
          <Badge variant="outline" className="text-xs">
            {recentFiles.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[300px]">
          <div className="space-y-1 p-3">
            {recentFiles.map((file) => {
              const isSelected = selectedFile?.id === file.id;
              
              return (
                <Button
                  key={file.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "w-full justify-start h-auto p-2 text-left",
                    isSelected && "bg-accent text-accent-foreground"
                  )}
                  onClick={() => onFileSelect(file)}
                >
                  <div className="flex items-start space-x-2 w-full min-w-0">
                    <FileIcon className="w-3 h-3 mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium truncate">
                          {file.name}
                        </span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {formatFileSize(file.size)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-xs text-muted-foreground truncate">
                          {file.path}
                        </span>
                        {file.complexity && (
                          <Badge 
                            variant="outline" 
                            className={cn(
                              "text-xs h-4 px-1",
                              file.complexity === 'High' && "border-destructive text-destructive",
                              file.complexity === 'Medium' && "border-warning text-warning",
                              file.complexity === 'Low' && "border-success text-success"
                            )}
                          >
                            {file.complexity}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </Button>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}