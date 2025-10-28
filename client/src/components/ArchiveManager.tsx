/**
 * Main ArchiveManager component.
 * Integrates all archive processing features: streaming, virtualization,
 * error recovery, search, collaboration, and undo/redo.
 */

import React, { useState, useCallback, useEffect } from "react";
import { HugeFileTree } from "./HugeFileTree";
import { ArchiveDashboard, type ArchiveStats } from "./ArchiveDashboard";
import { ErrorBoundary } from "./ErrorBoundary";
import { ArchiveSearchBar, type SearchFilters } from "./ArchiveSearchBar";
import { CollaborationPanel, type ChangeLog, type Notification } from "./CollaborationPanel";
import { ArchiveBreadcrumbs } from "./ArchiveBreadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileNode } from "@/lib/archiveHandlers";
import { UndoManager } from "@/lib/UndoManager";
import { exportErrors, exportFullReport, type ErrorLog, type RecoveryLog } from "@/lib/exportErrors";
import { 
  Undo2, 
  Redo2, 
  Download, 
  FileDown,
  Settings,
  Play,
  Pause,
  X
} from "lucide-react";

export interface ArchiveManagerProps {
  // Optional initial data
  initialFiles?: FileNode[];
  initialArchiveName?: string;
  
  // Callbacks
  onFileSelect?: (file: FileNode) => void;
  onExtract?: (files: FileNode[]) => void;
  onBatchOperation?: (operation: string, files: FileNode[]) => void;
  
  // Options
  enableCollaboration?: boolean;
  enableUndo?: boolean;
  maxUndoSteps?: number;
}

interface ArchiveState {
  files: FileNode[];
  archiveStack: string[];
  selectedFiles: Set<string>;
}

/**
 * Advanced Archive Manager with streaming, virtualization, and recovery.
 */
export const ArchiveManager: React.FC<ArchiveManagerProps> = ({
  initialFiles = [],
  initialArchiveName = "Archive",
  onFileSelect,
  onExtract,
  onBatchOperation,
  enableCollaboration = true,
  enableUndo = true,
  maxUndoSteps = 50
}) => {
  // State
  const [files, setFiles] = useState<FileNode[]>(initialFiles);
  const [filteredFiles, setFilteredFiles] = useState<FileNode[]>(initialFiles);
  const [archiveStack, setArchiveStack] = useState<string[]>([initialArchiveName]);
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [searchFilters, setSearchFilters] = useState<SearchFilters>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  // Statistics
  const [stats, setStats] = useState<ArchiveStats>({
    total: initialFiles.length,
    indexed: initialFiles.length,
    errors: 0,
    recovered: 0,
    progress: 100,
    operationStatus: 'idle'
  });

  // Collaboration
  const [changes, setChanges] = useState<ChangeLog[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Error tracking
  const [errors, setErrors] = useState<ErrorLog[]>([]);
  const [recoveries, setRecoveries] = useState<RecoveryLog[]>([]);

  // Undo manager
  const [undoManager] = useState(() => {
    if (!enableUndo) return null;
    const manager = new UndoManager<ArchiveState>(maxUndoSteps);
    manager.push({ files: initialFiles, archiveStack, selectedFiles }, 'Initial state');
    return manager;
  });

  // Update filtered files when search/filters change
  useEffect(() => {
    let filtered = [...files];

    // Apply text search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(file => 
        file.name.toLowerCase().includes(query) ||
        file.path.toLowerCase().includes(query)
      );
    }

    // Apply file type filter
    if (searchFilters.fileTypes && searchFilters.fileTypes.length > 0) {
      filtered = filtered.filter(file => {
        const ext = file.name.split('.').pop()?.toLowerCase();
        return ext && searchFilters.fileTypes!.includes(ext);
      });
    }

    // Apply error filter
    if (searchFilters.hasErrors) {
      filtered = filtered.filter(file => Boolean(file.error));
    }

    setFilteredFiles(filtered);
  }, [files, searchQuery, searchFilters]);

  // Handle file click
  const handleFileClick = useCallback((file: FileNode) => {
    if (onFileSelect) {
      onFileSelect(file);
    }

    // If it's a nested archive, navigate into it
    if (file.name.match(/\.(zip|tar|rar|7z|gz)$/i)) {
      setArchiveStack(prev => [...prev, file.name]);
      
      if (enableCollaboration) {
        addChangeLog('opened', `${file.name}`);
      }
    }
  }, [onFileSelect, enableCollaboration]);

  // Handle breadcrumb navigation
  const handleJumpToLevel = useCallback((level: number) => {
    const newStack = archiveStack.slice(0, level + 1);
    setArchiveStack(newStack);
    
    if (enableCollaboration) {
      addChangeLog('navigated', `to ${newStack[newStack.length - 1]}`);
    }
  }, [archiveStack, enableCollaboration]);

  // Handle search
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // Handle filter change
  const handleFilterChange = useCallback((filters: SearchFilters) => {
    setSearchFilters(filters);
  }, []);

  // Add change log entry
  const addChangeLog = useCallback((action: string, target?: string) => {
    const change: ChangeLog = {
      id: `${Date.now()}-${Math.random()}`,
      user: 'Current User', // Would come from auth in real app
      action,
      target,
      timestamp: new Date()
    };
    setChanges(prev => [change, ...prev].slice(0, 100)); // Keep last 100
  }, []);

  // Add notification
  const addNotification = useCallback((
    type: Notification['type'],
    message: string
  ) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random()}`,
      type,
      message,
      timestamp: new Date(),
      read: false
    };
    setNotifications(prev => [notification, ...prev].slice(0, 50)); // Keep last 50
  }, []);

  // Undo/Redo handlers
  const handleUndo = useCallback(() => {
    if (!undoManager) return;
    
    const previousState = undoManager.undo();
    if (previousState) {
      setFiles(previousState.files);
      setArchiveStack(previousState.archiveStack);
      setSelectedFiles(previousState.selectedFiles);
      
      addNotification('info', `Undid: ${undoManager.getRedoDescription() || 'action'}`);
    }
  }, [undoManager, addNotification]);

  const handleRedo = useCallback(() => {
    if (!undoManager) return;
    
    const nextState = undoManager.redo();
    if (nextState) {
      setFiles(nextState.files);
      setArchiveStack(nextState.archiveStack);
      setSelectedFiles(nextState.selectedFiles);
      
      addNotification('info', `Redid: ${undoManager.getRedoDescription() || 'action'}`);
    }
  }, [undoManager, addNotification]);

  // Save state to undo manager
  const saveState = useCallback((description: string) => {
    if (!undoManager) return;
    
    undoManager.push(
      { files, archiveStack, selectedFiles },
      description
    );
  }, [undoManager, files, archiveStack, selectedFiles]);

  // Export handlers
  const handleExportErrors = useCallback(() => {
    exportErrors(errors, archiveStack[archiveStack.length - 1]);
    addNotification('success', 'Errors exported successfully');
  }, [errors, archiveStack, addNotification]);

  const handleExportFullReport = useCallback(() => {
    exportFullReport(errors, recoveries, archiveStack[archiveStack.length - 1]);
    addNotification('success', 'Full report exported successfully');
  }, [errors, recoveries, archiveStack, addNotification]);

  // Toggle pause
  const handleTogglePause = useCallback(() => {
    setIsPaused(prev => !prev);
    addNotification('info', isPaused ? 'Processing resumed' : 'Processing paused');
  }, [isPaused, addNotification]);

  // Cancel operation
  const handleCancel = useCallback(() => {
    setIsProcessing(false);
    setIsPaused(false);
    addNotification('warning', 'Operation cancelled');
  }, [addNotification]);

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-full gap-4 p-4">
        {/* Header with controls */}
        <div className="flex items-center justify-between">
          <ArchiveBreadcrumbs 
            stack={archiveStack} 
            onJump={handleJumpToLevel} 
          />
          
          <div className="flex items-center gap-2">
            {/* Undo/Redo */}
            {enableUndo && undoManager && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleUndo}
                  disabled={!undoManager.canUndo()}
                  title={`Undo: ${undoManager.getUndoDescription() || ''}`}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRedo}
                  disabled={!undoManager.canRedo()}
                  title={`Redo: ${undoManager.getRedoDescription() || ''}`}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Processing controls */}
            {isProcessing && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTogglePause}
                >
                  {isPaused ? (
                    <Play className="h-4 w-4" />
                  ) : (
                    <Pause className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                >
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}

            {/* Export buttons */}
            {errors.length > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportErrors}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Export Errors
              </Button>
            )}
            {(errors.length > 0 || recoveries.length > 0) && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportFullReport}
              >
                <Download className="h-4 w-4 mr-2" />
                Full Report
              </Button>
            )}
          </div>
        </div>

        {/* Dashboard */}
        <ArchiveDashboard stats={stats} />

        {/* Search */}
        <ArchiveSearchBar 
          onSearch={handleSearch}
          onFilterChange={handleFilterChange}
        />

        {/* Main content area */}
        <div className="flex-1 flex gap-4 min-h-0">
          {/* File tree */}
          <Card className="flex-1 overflow-hidden">
            <CardContent className="p-4 h-full">
              <HugeFileTree 
                files={filteredFiles}
                onFileClick={handleFileClick}
                height={600}
              />
            </CardContent>
          </Card>

          {/* Collaboration panel */}
          {enableCollaboration && (
            <div className="w-80 flex-shrink-0">
              <CollaborationPanel 
                changes={changes}
                notifications={notifications}
              />
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default ArchiveManager;
