/**
 * Shows files indexed, errors, recovered, progress, and operation status.
 * Updates in real time as archives are parsed/extracted/repaired.
 */

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Clock,
  TrendingUp
} from "lucide-react";

export interface ArchiveStats {
  total: number;
  indexed: number;
  errors: number;
  recovered: number;
  progress: number; // 0-100
  currentFile?: string;
  operationStatus?: 'idle' | 'parsing' | 'extracting' | 'repairing' | 'complete';
  bytesProcessed?: number;
  totalBytes?: number;
  startTime?: Date;
  estimatedTimeRemaining?: number; // in seconds
}

export interface ArchiveDashboardProps {
  stats: ArchiveStats;
  className?: string;
}

/**
 * Dashboard component showing real-time archive processing statistics.
 */
export const ArchiveDashboard: React.FC<ArchiveDashboardProps> = ({
  stats,
  className
}) => {
  const progressPercentage = Math.min(100, Math.max(0, stats.progress));
  const hasErrors = stats.errors > 0;
  const hasRecovered = stats.recovered > 0;

  // Calculate processing speed
  const getProcessingSpeed = (): string => {
    if (!stats.bytesProcessed || !stats.startTime) return 'N/A';
    
    const elapsedSeconds = (Date.now() - stats.startTime.getTime()) / 1000;
    if (elapsedSeconds === 0) return 'N/A';
    
    const bytesPerSecond = stats.bytesProcessed / elapsedSeconds;
    return formatBytes(bytesPerSecond) + '/s';
  };

  // Format time remaining
  const formatTimeRemaining = (seconds?: number): string => {
    if (!seconds || seconds < 0) return 'Unknown';
    
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    return `${Math.round(seconds / 3600)}h`;
  };

  // Get status badge variant
  const getStatusVariant = (): "default" | "secondary" | "destructive" | "outline" => {
    switch (stats.operationStatus) {
      case 'complete': return 'default';
      case 'parsing':
      case 'extracting':
      case 'repairing': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Archive Processing Status</CardTitle>
            {stats.operationStatus && (
              <Badge variant={getStatusVariant()}>
                {stats.operationStatus === 'parsing' && <RefreshCw className="h-3 w-3 mr-1 animate-spin" />}
                {stats.operationStatus}
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Overall Progress</span>
              <span className="font-medium">{progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
          </div>

          {/* Current file */}
          {stats.currentFile && (
            <div className="text-sm">
              <span className="text-muted-foreground">Current: </span>
              <span className="font-mono text-xs truncate block mt-1">
                {stats.currentFile}
              </span>
            </div>
          )}

          {/* Statistics grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Total files */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <FileText className="h-4 w-4 text-blue-500" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Total Files</div>
                <div className="text-lg font-semibold">{stats.total}</div>
              </div>
            </div>

            {/* Indexed */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Indexed</div>
                <div className="text-lg font-semibold">{stats.indexed}</div>
              </div>
            </div>

            {/* Errors */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <AlertTriangle className={`h-4 w-4 ${hasErrors ? 'text-red-500' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Errors</div>
                <div className={`text-lg font-semibold ${hasErrors ? 'text-red-600' : ''}`}>
                  {stats.errors}
                </div>
              </div>
            </div>

            {/* Recovered */}
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
              <RefreshCw className={`h-4 w-4 ${hasRecovered ? 'text-green-500' : 'text-gray-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs text-muted-foreground">Recovered</div>
                <div className={`text-lg font-semibold ${hasRecovered ? 'text-green-600' : ''}`}>
                  {stats.recovered}
                </div>
              </div>
            </div>
          </div>

          {/* Additional metrics */}
          {(stats.bytesProcessed !== undefined || stats.estimatedTimeRemaining !== undefined) && (
            <div className="pt-2 border-t space-y-2">
              {stats.bytesProcessed !== undefined && stats.totalBytes !== undefined && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Processing Speed
                  </span>
                  <span className="font-medium">{getProcessingSpeed()}</span>
                </div>
              )}
              
              {stats.estimatedTimeRemaining !== undefined && stats.operationStatus !== 'complete' && (
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Est. Time Remaining
                  </span>
                  <span className="font-medium">{formatTimeRemaining(stats.estimatedTimeRemaining)}</span>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

/**
 * Format bytes in human-readable format.
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default ArchiveDashboard;
