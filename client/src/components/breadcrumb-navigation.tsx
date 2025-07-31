import { ChevronRight, Home, Archive } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildBreadcrumbs } from "@/lib/file-utils";

interface BreadcrumbNavigationProps {
  currentFile?: {
    name: string;
    path: string;
  } | null;
  archiveName?: string;
  onNavigate?: (path: string) => void;
}

export function BreadcrumbNavigation({ 
  currentFile, 
  archiveName, 
  onNavigate 
}: BreadcrumbNavigationProps) {
  if (!currentFile) return null;

  const breadcrumbs = buildBreadcrumbs(currentFile.path);
  
  return (
    <div className="flex items-center space-x-1 text-sm text-muted-foreground bg-muted/30 px-3 py-2 rounded-md border">
      {/* Archive Root */}
      <Button
        variant="ghost"
        size="sm"
        className="h-6 px-2 text-xs hover:bg-accent/10"
        onClick={() => onNavigate?.('/')}
      >
        <Archive className="w-3 h-3 mr-1" />
        {archiveName || 'Archive'}
      </Button>
      
      {breadcrumbs.length > 0 && (
        <ChevronRight className="w-3 h-3" />
      )}
      
      {/* Path segments */}
      {breadcrumbs.map((crumb, index) => (
        <div key={index} className="flex items-center space-x-1">
          <Button
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs hover:bg-accent/10"
            onClick={() => onNavigate?.(crumb.path)}
          >
            {crumb.name}
          </Button>
          {index < breadcrumbs.length - 1 && (
            <ChevronRight className="w-3 h-3" />
          )}
        </div>
      ))}
      
      {/* Current file */}
      {breadcrumbs.length > 0 && (
        <>
          <ChevronRight className="w-3 h-3" />
          <span className="font-medium text-foreground">
            {currentFile.name}
          </span>
        </>
      )}
    </div>
  );
}