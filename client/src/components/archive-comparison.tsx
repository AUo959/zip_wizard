import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  GitCompare,
  Plus,
  Minus,
  RefreshCw,
  ArrowRight,
  ArrowLeft,
  FileCode,
  CheckCircle,
  AlertCircle,
  Download,
} from 'lucide-react';

interface ArchiveComparisonProps {
  archive1?: any;
  archive2?: any;
  files1?: any[];
  files2?: any[];
  onSelectFile?: (file: any, archive: 'left' | 'right') => void;
}

interface ComparisonResult {
  added: FileComparison[];
  removed: FileComparison[];
  modified: FileComparison[];
  unchanged: FileComparison[];
  statistics: ComparisonStats;
}

interface FileComparison {
  path: string;
  name: string;
  status: 'added' | 'removed' | 'modified' | 'unchanged';
  sizeChange?: number;
  complexityChange?: string;
  leftFile?: any;
  rightFile?: any;
}

interface ComparisonStats {
  totalFilesLeft: number;
  totalFilesRight: number;
  added: number;
  removed: number;
  modified: number;
  unchanged: number;
  sizeChangeTotal: number;
}

export function ArchiveComparison({
  archive1,
  archive2,
  files1 = [],
  files2 = [],
  onSelectFile,
}: ArchiveComparisonProps) {
  const [comparisonResult, setComparisonResult] = useState<ComparisonResult | null>(null);
  const [isComparing, setIsComparing] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'added' | 'removed' | 'modified'>(
    'overview'
  );
  const [filterText, setFilterText] = useState('');

  const compareArchives = useCallback(() => {
    if (!files1.length && !files2.length) return;

    setIsComparing(true);

    // Create maps for efficient lookup
    const leftMap = new Map(files1.map(f => [f.path || f.name, f]));
    const rightMap = new Map(files2.map(f => [f.path || f.name, f]));

    const added: FileComparison[] = [];
    const removed: FileComparison[] = [];
    const modified: FileComparison[] = [];
    const unchanged: FileComparison[] = [];

    // Find removed and modified files
    leftMap.forEach((leftFile, path) => {
      const rightFile = rightMap.get(path);

      if (!rightFile) {
        removed.push({
          path,
          name: leftFile.name,
          status: 'removed',
          leftFile,
        });
      } else {
        // Check if file is modified
        const isModified =
          leftFile.size !== rightFile.size ||
          leftFile.hash !== rightFile.hash ||
          leftFile.content !== rightFile.content;

        if (isModified) {
          modified.push({
            path,
            name: leftFile.name,
            status: 'modified',
            sizeChange: (rightFile.size || 0) - (leftFile.size || 0),
            complexityChange:
              rightFile.complexity !== leftFile.complexity
                ? `${leftFile.complexity} → ${rightFile.complexity}`
                : undefined,
            leftFile,
            rightFile,
          });
        } else {
          unchanged.push({
            path,
            name: leftFile.name,
            status: 'unchanged',
            leftFile,
            rightFile,
          });
        }
      }
    });

    // Find added files
    rightMap.forEach((rightFile, path) => {
      if (!leftMap.has(path)) {
        added.push({
          path,
          name: rightFile.name,
          status: 'added',
          rightFile,
        });
      }
    });

    const statistics: ComparisonStats = {
      totalFilesLeft: files1.length,
      totalFilesRight: files2.length,
      added: added.length,
      removed: removed.length,
      modified: modified.length,
      unchanged: unchanged.length,
      sizeChangeTotal: modified.reduce((sum, f) => sum + (f.sizeChange || 0), 0),
    };

    setComparisonResult({
      added,
      removed,
      modified,
      unchanged,
      statistics,
    });

    setIsComparing(false);
  }, [files1, files2]);

  useEffect(() => {
    if (files1.length > 0 || files2.length > 0) {
      compareArchives();
    }
  }, [files1, files2, compareArchives]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'added':
        return <Plus className="w-4 h-4 text-green-600" />;
      case 'removed':
        return <Minus className="w-4 h-4 text-red-600" />;
      case 'modified':
        return <RefreshCw className="w-4 h-4 text-yellow-600" />;
      default:
        return <CheckCircle className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'added':
        return 'text-green-600 bg-green-50';
      case 'removed':
        return 'text-red-600 bg-red-50';
      case 'modified':
        return 'text-yellow-600 bg-yellow-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    const value = bytes / Math.pow(k, i);
    return `${value > 0 ? '+' : ''}${value.toFixed(1)} ${sizes[i]}`;
  };

  const renderFileList = (files: FileComparison[]) => {
    const filteredFiles = files.filter(
      f =>
        f.name.toLowerCase().includes(filterText.toLowerCase()) ||
        f.path.toLowerCase().includes(filterText.toLowerCase())
    );

    return (
      <ScrollArea className="h-[400px]">
        <div className="space-y-2 p-2">
          {filteredFiles.map((file, index) => (
            <div
              key={`${file.path}-${index}`}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => {
                if (file.leftFile) onSelectFile?.(file.leftFile, 'left');
                if (file.rightFile) onSelectFile?.(file.rightFile, 'right');
              }}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(file.status)}
                <div>
                  <div className="flex items-center gap-2">
                    <FileCode className="w-4 h-4 text-muted-foreground" />
                    <span className="font-medium text-sm">{file.name}</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">{file.path}</div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {file.sizeChange !== undefined && file.sizeChange !== 0 && (
                  <Badge
                    variant="outline"
                    className={file.sizeChange > 0 ? 'text-green-600' : 'text-red-600'}
                  >
                    {formatBytes(file.sizeChange)}
                  </Badge>
                )}
                {file.complexityChange && (
                  <Badge variant="outline" className="text-yellow-600">
                    {file.complexityChange}
                  </Badge>
                )}
                <Badge className={getStatusColor(file.status)}>{file.status}</Badge>
              </div>
            </div>
          ))}
        </div>
      </ScrollArea>
    );
  };

  const exportComparison = () => {
    if (!comparisonResult) return;

    const report = {
      timestamp: new Date().toISOString(),
      leftArchive: archive1?.name || 'Archive 1',
      rightArchive: archive2?.name || 'Archive 2',
      statistics: comparisonResult.statistics,
      changes: {
        added: comparisonResult.added.map(f => ({ path: f.path, name: f.name })),
        removed: comparisonResult.removed.map(f => ({ path: f.path, name: f.name })),
        modified: comparisonResult.modified.map(f => ({
          path: f.path,
          name: f.name,
          sizeChange: f.sizeChange,
          complexityChange: f.complexityChange,
        })),
      },
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparison-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitCompare className="w-5 h-5 text-purple-600" />
            Archive Comparison Tool
            <Badge variant="outline" className="ml-auto">
              Advanced Analysis
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Archive Selection Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Left Archive</span>
                <ArrowLeft className="w-4 h-4 text-muted-foreground" />
              </div>
              {archive1 ? (
                <div>
                  <div className="font-medium">{archive1.name}</div>
                  <div className="text-sm text-muted-foreground">{files1.length} files</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No archive selected</div>
              )}
            </div>

            <div className="p-4 bg-muted/30 rounded-lg border">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Right Archive</span>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </div>
              {archive2 ? (
                <div>
                  <div className="font-medium">{archive2.name}</div>
                  <div className="text-sm text-muted-foreground">{files2.length} files</div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">No archive selected</div>
              )}
            </div>
          </div>

          {/* Comparison Statistics */}
          {comparisonResult && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-4 text-center">
                  <Plus className="w-6 h-6 mx-auto mb-2 text-green-600" />
                  <div className="text-2xl font-bold text-green-700">
                    {comparisonResult.statistics.added}
                  </div>
                  <div className="text-xs text-green-600">Added</div>
                </CardContent>
              </Card>

              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-4 text-center">
                  <Minus className="w-6 h-6 mx-auto mb-2 text-red-600" />
                  <div className="text-2xl font-bold text-red-700">
                    {comparisonResult.statistics.removed}
                  </div>
                  <div className="text-xs text-red-600">Removed</div>
                </CardContent>
              </Card>

              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4 text-center">
                  <RefreshCw className="w-6 h-6 mx-auto mb-2 text-yellow-600" />
                  <div className="text-2xl font-bold text-yellow-700">
                    {comparisonResult.statistics.modified}
                  </div>
                  <div className="text-xs text-yellow-600">Modified</div>
                </CardContent>
              </Card>

              <Card className="border-gray-200 bg-gray-50">
                <CardContent className="p-4 text-center">
                  <CheckCircle className="w-6 h-6 mx-auto mb-2 text-gray-600" />
                  <div className="text-2xl font-bold text-gray-700">
                    {comparisonResult.statistics.unchanged}
                  </div>
                  <div className="text-xs text-gray-600">Unchanged</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* File Changes Tabs */}
          {comparisonResult && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="added">Added ({comparisonResult.statistics.added})</TabsTrigger>
                <TabsTrigger value="removed">
                  Removed ({comparisonResult.statistics.removed})
                </TabsTrigger>
                <TabsTrigger value="modified">
                  Modified ({comparisonResult.statistics.modified})
                </TabsTrigger>
              </TabsList>

              <div className="mt-4 mb-2">
                <input
                  type="text"
                  placeholder="Filter files..."
                  value={filterText}
                  onChange={e => setFilterText(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <TabsContent value="overview">
                <div className="space-y-4">
                  <Alert>
                    <AlertCircle className="w-4 h-4" />
                    <AlertDescription>
                      Comparison complete. Found{' '}
                      {comparisonResult.statistics.added +
                        comparisonResult.statistics.removed +
                        comparisonResult.statistics.modified}{' '}
                      changes between the archives.
                    </AlertDescription>
                  </Alert>

                  {/* Summary Chart */}
                  <div className="p-4 bg-muted/30 rounded-lg">
                    <h4 className="text-sm font-medium mb-3">Change Distribution</h4>
                    <div className="space-y-2">
                      {comparisonResult.statistics.added > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-xs">Added</div>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-green-500"
                              style={{
                                width: `${
                                  (comparisonResult.statistics.added /
                                    (files1.length + files2.length)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs">{comparisonResult.statistics.added}</span>
                        </div>
                      )}
                      {comparisonResult.statistics.removed > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-xs">Removed</div>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-red-500"
                              style={{
                                width: `${
                                  (comparisonResult.statistics.removed /
                                    (files1.length + files2.length)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs">{comparisonResult.statistics.removed}</span>
                        </div>
                      )}
                      {comparisonResult.statistics.modified > 0 && (
                        <div className="flex items-center gap-2">
                          <div className="w-20 text-xs">Modified</div>
                          <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-yellow-500"
                              style={{
                                width: `${
                                  (comparisonResult.statistics.modified /
                                    (files1.length + files2.length)) *
                                  100
                                }%`,
                              }}
                            />
                          </div>
                          <span className="text-xs">{comparisonResult.statistics.modified}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <Button onClick={exportComparison} className="w-full">
                    <Download className="w-4 h-4 mr-2" />
                    Export Comparison Report
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="added">{renderFileList(comparisonResult.added)}</TabsContent>

              <TabsContent value="removed">{renderFileList(comparisonResult.removed)}</TabsContent>

              <TabsContent value="modified">
                {renderFileList(comparisonResult.modified)}
              </TabsContent>
            </Tabs>
          )}

          {/* No Data State */}
          {!comparisonResult && !isComparing && (
            <div className="text-center py-8 text-muted-foreground">
              <GitCompare className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Select two archives to compare their contents</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
