/**
 * Advanced ArchiveManager Component
 *
 * Comprehensive archive management with error recovery, repair,
 * accessibility, and extensibility features.
 */

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Archive as ArchiveIcon,
  Search,
  Download,
  Trash2,
  Tag,
  GitCompare,
  Shield,
  Wrench,
  MoreVertical,
  AlertTriangle,
  Loader2,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { ErrorBoundary } from './error-boundary';
import { AdvancedFileTree } from './advanced-file-tree';
import type { Archive, ArchiveAction, ArchiveManagerProps, FileNode } from '@shared/archive-types';
import { cn, capitalizeFirst } from '@/lib/utils';

/**
 * Archive card component showing individual archive
 */
interface ArchiveCardProps {
  archive: Archive;
  selected: boolean;
  onSelect: () => void;
  onAction: (_action: ArchiveAction, _params?: Record<string, unknown>) => void;
  renderDetails?: (_archive: Archive) => React.ReactNode;
}

const ArchiveCard: React.FC<ArchiveCardProps> = ({
  archive,
  selected,
  onSelect,
  onAction,
  renderDetails,
}) => {
  const formatSize = (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return `${size.toFixed(2)} ${units[unitIndex]}`;
  };

  const getStatusColor = (status: Archive['status']): string => {
    const colors = {
      idle: 'text-muted-foreground',
      loading: 'text-blue-500',
      processing: 'text-blue-500',
      analyzing: 'text-purple-500',
      repairing: 'text-yellow-500',
      completed: 'text-green-500',
      error: 'text-red-500',
      corrupted: 'text-red-500',
      partial: 'text-yellow-500',
    };
    return colors[status] || 'text-muted-foreground';
  };

  const getHealthScoreColor = (score?: number): string => {
    if (!score) return 'text-muted-foreground';
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  return (
    <ErrorBoundary boundaryId={`archive-card-${archive.id}`}>
      <Card
        className={cn(
          'cursor-pointer transition-all',
          selected && 'ring-2 ring-primary',
          archive.error && 'border-destructive'
        )}
        onClick={onSelect}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-3 flex-1 min-w-0">
              <ArchiveIcon className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <CardTitle className="text-lg truncate" title={archive.name}>
                  {archive.name}
                </CardTitle>
                <CardDescription className="flex items-center space-x-2">
                  <span>{formatSize(archive.size)}</span>
                  {archive.format && <span>• {archive.format.toUpperCase()}</span>}
                  {archive.fileCount !== undefined && <span>• {archive.fileCount} files</span>}
                </CardDescription>
              </div>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onAction('export')}>
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('tag')}>
                  <Tag className="w-4 h-4 mr-2" />
                  Edit Tags
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('compare')}>
                  <GitCompare className="w-4 h-4 mr-2" />
                  Compare
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onAction('scan')}>
                  <Shield className="w-4 h-4 mr-2" />
                  Scan
                </DropdownMenuItem>
                {archive.error && (
                  <DropdownMenuItem onClick={() => onAction('repair')}>
                    <Wrench className="w-4 h-4 mr-2" />
                    Attempt Repair
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onAction('delete')} className="text-destructive">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-3">
          {/* Status and Health */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <span className={cn('font-medium', getStatusColor(archive.status))}>
                {capitalizeFirst(archive.status)}
              </span>
              {archive.status === 'processing' && archive.progress !== undefined && (
                <span className="text-muted-foreground">({archive.progress}%)</span>
              )}
            </div>

            {archive.healthScore !== undefined && (
              <div className="flex items-center space-x-1">
                <span className="text-muted-foreground">Health:</span>
                <span className={cn('font-semibold', getHealthScoreColor(archive.healthScore))}>
                  {archive.healthScore}%
                </span>
              </div>
            )}
          </div>

          {/* Progress bar */}
          {archive.progress !== undefined && archive.progress < 100 && (
            <Progress value={archive.progress} className="h-1" />
          )}

          {/* Tags */}
          {archive.tags && archive.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {archive.tags.map(tag => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Error display */}
          {archive.error && (
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription className="text-xs">{archive.error.message}</AlertDescription>
            </Alert>
          )}

          {/* Corruption indicators */}
          {archive.corruptedFileCount !== undefined && archive.corruptedFileCount > 0 && (
            <div className="flex items-center space-x-2 text-sm text-yellow-600 dark:text-yellow-400">
              <AlertTriangle className="w-4 h-4" />
              <span>{archive.corruptedFileCount} corrupted file(s)</span>
            </div>
          )}

          {/* Custom details renderer */}
          {renderDetails && renderDetails(archive)}
        </CardContent>
      </Card>
    </ErrorBoundary>
  );
};

/**
 * Main ArchiveManager component
 */
export const AdvancedArchiveManager: React.FC<ArchiveManagerProps> = ({
  archives,
  onArchiveAction,
  selectedArchiveId,
  loading = false,
  searchQuery: externalSearchQuery,
  renderFileTree,
  renderArchiveDetails,
  renderError,
  handlerRegistry: _handlerRegistry,
  enableRepair: _enableRepair = true,
  enableComparison: _enableComparison = true,
  className,
}) => {
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedArchiveId);
  const [searchQuery, setSearchQuery] = useState(externalSearchQuery || '');
  const [selectedNode, setSelectedNode] = useState<FileNode | null>(null);

  // Filter archives based on search
  const filteredArchives = useMemo(() => {
    if (!searchQuery.trim()) return archives;

    const query = searchQuery.toLowerCase();
    return archives.filter(
      archive =>
        archive.name.toLowerCase().includes(query) ||
        archive.tags?.some(tag => tag.toLowerCase().includes(query))
    );
  }, [archives, searchQuery]);

  // Get selected archive
  const selectedArchive = useMemo(() => {
    return archives.find(a => a.id === selectedId);
  }, [archives, selectedId]);

  // Handle archive selection
  const handleSelectArchive = useCallback((archiveId: string) => {
    setSelectedId(archiveId);
    setSelectedNode(null);
  }, []);

  // Handle archive action
  const handleArchiveAction = useCallback(
    (archiveId: string, action: ArchiveAction, params?: Record<string, unknown>) => {
      onArchiveAction(archiveId, action, params);
    },
    [onArchiveAction]
  );

  // Handle node selection in file tree
  const handleNodeSelect = useCallback((node: FileNode) => {
    setSelectedNode(node);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
          <p className="text-muted-foreground">Loading archives...</p>
        </div>
      </div>
    );
  }

  if (archives.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center space-y-4">
          <ArchiveIcon className="w-12 h-12 mx-auto text-muted-foreground" />
          <div>
            <h3 className="font-semibold text-lg">No archives found</h3>
            <p className="text-sm text-muted-foreground">Upload an archive to get started</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary boundaryId="archive-manager">
      <div className={cn('space-y-4', className)}>
        {/* Header with search */}
        <div className="flex items-center space-x-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search archives..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Badge variant="secondary">
            {filteredArchives.length} {filteredArchives.length === 1 ? 'archive' : 'archives'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Archive list */}
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredArchives.map(archive => (
              <ArchiveCard
                key={archive.id}
                archive={archive}
                selected={archive.id === selectedId}
                onSelect={() => handleSelectArchive(archive.id)}
                onAction={(action, params) => handleArchiveAction(archive.id, action, params)}
                renderDetails={renderArchiveDetails}
              />
            ))}
          </div>

          {/* File tree / details panel */}
          <div className="space-y-4">
            {selectedArchive ? (
              <ErrorBoundary boundaryId={`archive-details-${selectedArchive.id}`}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <FileText className="w-5 h-5" />
                      <span>File Structure</span>
                    </CardTitle>
                    <CardDescription>{selectedArchive.name}</CardDescription>
                  </CardHeader>
                  <CardContent className="max-h-[500px] overflow-y-auto">
                    {selectedArchive.error && renderError ? (
                      renderError(selectedArchive.error, selectedArchive)
                    ) : selectedArchive.fileTree && selectedArchive.fileTree.length > 0 ? (
                      renderFileTree ? (
                        renderFileTree(selectedArchive, selectedArchive.fileTree)
                      ) : (
                        <AdvancedFileTree
                          nodes={selectedArchive.fileTree}
                          onNodeSelect={handleNodeSelect}
                          selectedNodeId={selectedNode?.id}
                          searchQuery={searchQuery}
                          showErrors
                          lazyLoad={false}
                        />
                      )
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <p>No file structure available</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-4"
                          onClick={() => handleArchiveAction(selectedArchive.id, 'analyze')}
                        >
                          Analyze Archive
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Selected node details */}
                {selectedNode && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Selected File</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Name:</span>
                        <span className="font-medium">{selectedNode.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{selectedNode.type}</span>
                      </div>
                      {selectedNode.size !== undefined && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Size:</span>
                          <span className="font-medium">
                            {(selectedNode.size / 1024).toFixed(2)} KB
                          </span>
                        </div>
                      )}
                      {selectedNode.error && (
                        <Alert variant="destructive" className="mt-2">
                          <AlertCircle className="w-4 h-4" />
                          <AlertDescription className="text-xs">
                            {selectedNode.error.message}
                          </AlertDescription>
                        </Alert>
                      )}
                    </CardContent>
                  </Card>
                )}
              </ErrorBoundary>
            ) : (
              <Card>
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-2">
                    <ArchiveIcon className="w-8 h-8 mx-auto text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">
                      Select an archive to view details
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};
