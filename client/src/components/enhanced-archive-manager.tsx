import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Archive,
  Zap,
  TrendingUp,
  Copy,
  Merge,
  Filter,
  Search,
  Layers,
  HardDrive,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface ArchiveAnalysis {
  id: string;
  name: string;
  size: number;
  compressionRatio: number;
  duplicateFiles: number;
  healthScore: number;
  recommendations: string[];
  largeFiles: { name: string; size: number }[];
  nestedArchives: number;
  lastOptimized?: Date;
}

interface EnhancedArchiveManagerProps {
  archives: any[];
  onArchiveProcess: (archiveId: string, operation: string, params?: any) => void;
  onBatchOperation: (archiveIds: string[], operation: string) => void;
}

export function EnhancedArchiveManager({
  archives,
  onArchiveProcess,
  onBatchOperation,
}: EnhancedArchiveManagerProps) {
  const [selectedArchives, setSelectedArchives] = useState<string[]>([]);
  const [analysisResults, setAnalysisResults] = useState<ArchiveAnalysis[]>([]);
  const [processingStatus, setProcessingStatus] = useState<Record<string, number>>({});
  const [filterCriteria, setFilterCriteria] = useState({
    minHealthScore: 0,
    maxSize: '',
    hasIssues: false,
  });
  const [optimizationMode, setOptimizationMode] = useState('balanced');

  // Mock analysis results for demonstration
  useEffect(() => {
    if (archives.length > 0) {
      const mockAnalysis: ArchiveAnalysis[] = archives.map((archive, index) => ({
        id: archive.id || `archive-${index}`,
        name: archive.name || `Archive ${index + 1}`,
        size: Math.floor(Math.random() * 1000000000), // Random size in bytes
        compressionRatio: 0.3 + Math.random() * 0.4, // 30-70%
        duplicateFiles: Math.floor(Math.random() * 50),
        healthScore: 60 + Math.floor(Math.random() * 40), // 60-100
        recommendations: [
          'Remove duplicate files to save space',
          'Consider higher compression for text files',
          'Archive contains large media files',
        ].slice(0, Math.floor(Math.random() * 3) + 1),
        largeFiles: [
          { name: 'video.mp4', size: 50000000 },
          { name: 'dataset.csv', size: 25000000 },
        ],
        nestedArchives: Math.floor(Math.random() * 5),
        lastOptimized:
          Math.random() > 0.5
            ? new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
            : undefined,
      }));
      setAnalysisResults(mockAnalysis);
    }
  }, [archives]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthScoreColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const handleArchiveSelect = (archiveId: string) => {
    setSelectedArchives(prev =>
      prev.includes(archiveId) ? prev.filter(id => id !== archiveId) : [...prev, archiveId]
    );
  };

  const handleOptimization = (archiveId: string) => {
    setProcessingStatus(prev => ({ ...prev, [archiveId]: 0 }));

    // Simulate processing
    const interval = setInterval(() => {
      setProcessingStatus(prev => {
        const currentProgress = prev[archiveId] || 0;
        if (currentProgress >= 100) {
          clearInterval(interval);
          onArchiveProcess(archiveId, 'optimize', { mode: optimizationMode });
          return { ...prev, [archiveId]: 100 };
        }
        return { ...prev, [archiveId]: currentProgress + Math.random() * 15 };
      });
    }, 200);
  };

  const handleBatchOptimization = () => {
    if (selectedArchives.length > 0) {
      onBatchOperation(selectedArchives, 'batch-optimize');
      setSelectedArchives([]);
    }
  };

  const filteredAnalysis = analysisResults.filter(analysis => {
    if (analysis.healthScore < filterCriteria.minHealthScore) return false;
    if (filterCriteria.maxSize && analysis.size > parseInt(filterCriteria.maxSize)) return false;
    if (filterCriteria.hasIssues && analysis.recommendations.length === 0) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header with Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Archive className="w-5 h-5 text-primary" />
            <span>Enhanced Archive Manager</span>
            <Badge variant="secondary" className="ml-auto">
              {archives.length} Archives
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={handleBatchOptimization}
                disabled={selectedArchives.length === 0}
                className="flex items-center space-x-2"
              >
                <Zap className="w-4 h-4" />
                <span>Optimize Selected ({selectedArchives.length})</span>
              </Button>
              <Button
                variant="outline"
                onClick={() => onBatchOperation(selectedArchives, 'consolidate')}
                disabled={selectedArchives.length < 2}
              >
                <Merge className="w-4 h-4 mr-2" />
                Consolidate
              </Button>
              <Button
                variant="outline"
                onClick={() => onBatchOperation(selectedArchives, 'deduplicate')}
                disabled={selectedArchives.length === 0}
              >
                <Copy className="w-4 h-4 mr-2" />
                Remove Duplicates
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <Select value={optimizationMode} onValueChange={setOptimizationMode}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="aggressive">Aggressive</SelectItem>
                  <SelectItem value="balanced">Balanced</SelectItem>
                  <SelectItem value="conservative">Conservative</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="analysis" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="analysis">Analysis</TabsTrigger>
          <TabsTrigger value="optimization">Optimization</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="analysis" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="p-4">
              <div className="flex gap-4 items-center">
                <div className="flex items-center space-x-2">
                  <Filter className="w-4 h-4" />
                  <span className="text-sm font-medium">Filters:</span>
                </div>
                <Input
                  placeholder="Min Health Score"
                  type="number"
                  value={filterCriteria.minHealthScore}
                  onChange={e =>
                    setFilterCriteria(prev => ({
                      ...prev,
                      minHealthScore: parseInt(e.target.value) || 0,
                    }))
                  }
                  className="w-32"
                />
                <Input
                  placeholder="Max Size (bytes)"
                  value={filterCriteria.maxSize}
                  onChange={e => setFilterCriteria(prev => ({ ...prev, maxSize: e.target.value }))}
                  className="w-32"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setFilterCriteria({ minHealthScore: 0, maxSize: '', hasIssues: false })
                  }
                >
                  Clear
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Archive List */}
          <div className="space-y-4">
            {filteredAnalysis.map(analysis => (
              <Card key={analysis.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={selectedArchives.includes(analysis.id)}
                        onChange={() => handleArchiveSelect(analysis.id)}
                        className="rounded"
                      />
                      <Archive className="w-5 h-5 text-primary" />
                      <div>
                        <h3 className="font-semibold">{analysis.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {formatFileSize(analysis.size)} •{' '}
                          {Math.round(analysis.compressionRatio * 100)}% compressed
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge className={getHealthScoreColor(analysis.healthScore)}>
                        Health: {analysis.healthScore}%
                      </Badge>
                      <Button
                        size="sm"
                        onClick={() => handleOptimization(analysis.id)}
                        disabled={processingStatus[analysis.id] !== undefined}
                      >
                        {processingStatus[analysis.id] !== undefined ? (
                          <div className="flex items-center space-x-2">
                            <span>Processing...</span>
                            <div className="w-16">
                              <Progress value={processingStatus[analysis.id]} />
                            </div>
                          </div>
                        ) : (
                          <>
                            <Zap className="w-4 h-4 mr-1" />
                            Optimize
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Copy className="w-4 h-4 text-yellow-500" />
                      <span className="text-sm">{analysis.duplicateFiles} duplicates</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Layers className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">{analysis.nestedArchives} nested</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <HardDrive className="w-4 h-4 text-green-500" />
                      <span className="text-sm">{analysis.largeFiles.length} large files</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-purple-500" />
                      <span className="text-sm">
                        {analysis.lastOptimized
                          ? `Optimized ${Math.floor((Date.now() - analysis.lastOptimized.getTime()) / (1000 * 60 * 60 * 24))}d ago`
                          : 'Never optimized'}
                      </span>
                    </div>
                  </div>

                  {analysis.recommendations.length > 0 && (
                    <Alert>
                      <AlertTriangle className="w-4 h-4" />
                      <AlertDescription>
                        <div className="space-y-1">
                          <div className="font-medium">Recommendations:</div>
                          {analysis.recommendations.map((rec, index) => (
                            <div key={index} className="text-sm">
                              • {rec}
                            </div>
                          ))}
                        </div>
                      </AlertDescription>
                    </Alert>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="optimization" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Optimization Algorithms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-2 border-green-500/20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Compression Optimization</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Smart algorithm selection based on file types and content analysis.
                    </p>
                    <Button size="sm" className="w-full">
                      <TrendingUp className="w-4 h-4 mr-2" />
                      Analyze Potential
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-500/20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Duplicate Detection</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Content-based similarity detection with smart deduplication.
                    </p>
                    <Button size="sm" className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      Scan Duplicates
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-2 border-purple-500/20">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-2">Structure Optimization</h3>
                    <p className="text-sm text-muted-foreground mb-3">
                      Reorganize archive structure for optimal access patterns.
                    </p>
                    <Button size="sm" className="w-full">
                      <Layers className="w-4 h-4 mr-2" />
                      Restructure
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Storage Insights</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Total Storage Used</span>
                    <span className="font-semibold">
                      {formatFileSize(analysisResults.reduce((acc, a) => acc + a.size, 0))}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Potential Savings</span>
                    <span className="font-semibold text-green-600">
                      ~
                      {formatFileSize(
                        analysisResults.reduce(
                          (acc, a) => acc + a.size * (1 - a.compressionRatio),
                          0
                        )
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Average Health Score</span>
                    <span className="font-semibold">
                      {Math.round(
                        analysisResults.reduce((acc, a) => acc + a.healthScore, 0) /
                          analysisResults.length
                      )}
                      %
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Optimization Impact</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Archives Needing Attention</span>
                    <span className="font-semibold text-yellow-600">
                      {analysisResults.filter(a => a.healthScore < 80).length}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Total Duplicate Files</span>
                    <span className="font-semibold text-red-600">
                      {analysisResults.reduce((acc, a) => acc + a.duplicateFiles, 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span>Nested Archives</span>
                    <span className="font-semibold">
                      {analysisResults.reduce((acc, a) => acc + a.nestedArchives, 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Archive Management Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Default Optimization Mode</label>
                  <Select value={optimizationMode} onValueChange={setOptimizationMode}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="aggressive">Aggressive - Maximum compression</SelectItem>
                      <SelectItem value="balanced">Balanced - Performance vs. size</SelectItem>
                      <SelectItem value="conservative">
                        Conservative - Preserve compatibility
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Processing Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">
                        Auto-detect file types for optimal compression
                      </span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" defaultChecked />
                      <span className="text-sm">Enable privacy mode for sensitive archives</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input type="checkbox" />
                      <span className="text-sm">Create backup before optimization</span>
                    </label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
