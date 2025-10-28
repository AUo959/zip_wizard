import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Archive } from '@shared/archive-types';
import { BarChart3, FileText, Code, Folder, Zap } from 'lucide-react';

interface AnalyticsViewProps {
  files?: Array<{
    id: string;
    name: string;
    extension: string;
    language: string;
    complexity: string;
    size: number;
  }>;
  selectedArchive?: Archive;
}

export function AnalyticsView({ files = [], selectedArchive }: AnalyticsViewProps) {
  const totalFiles = files.length;
  const totalSize = files.reduce((sum, file) => sum + file.size, 0);

  // Language distribution
  const languageStats = files.reduce(
    (acc, file) => {
      acc[file.language] = (acc[file.language] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  // Complexity distribution
  const complexityStats = files.reduce(
    (acc, file) => {
      if (file.complexity) {
        acc[file.complexity] = (acc[file.complexity] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  // File size distribution
  const sizeBands = {
    'Small (<10KB)': files.filter(f => f.size < 10000).length,
    'Medium (10KB-100KB)': files.filter(f => f.size >= 10000 && f.size < 100000).length,
    'Large (>100KB)': files.filter(f => f.size >= 100000).length,
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      <div className="flex items-center space-x-2">
        <BarChart3 className="w-6 h-6 text-primary" />
        <h2 className="text-2xl font-bold">Analytics Dashboard</h2>
        {selectedArchive && <Badge variant="outline">{selectedArchive.name}</Badge>}
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <FileText className="w-4 h-4" />
              <span>Total Files</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalFiles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Folder className="w-4 h-4" />
              <span>Total Size</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(totalSize)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Code className="w-4 h-4" />
              <span>Languages</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Object.keys(languageStats).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Avg Complexity</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {complexityStats.High ? 'High' : complexityStats.Medium ? 'Medium' : 'Low'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Language Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Language Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(languageStats)
            .sort(([, a], [, b]) => b - a)
            .map(([language, count]) => (
              <div key={language} className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm font-medium">{language}</span>
                  <Badge variant="outline">{count} files</Badge>
                </div>
                <Progress value={(count / totalFiles) * 100} className="h-2" />
              </div>
            ))}
        </CardContent>
      </Card>

      {/* Complexity Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Code Complexity</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(complexityStats).map(([complexity, count]) => (
            <div key={complexity} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{complexity}</span>
                <Badge
                  variant="outline"
                  className={
                    complexity === 'High'
                      ? 'border-red-500 text-red-500'
                      : complexity === 'Medium'
                        ? 'border-yellow-500 text-yellow-500'
                        : 'border-green-500 text-green-500'
                  }
                >
                  {count} files
                </Badge>
              </div>
              <Progress value={(count / totalFiles) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>

      {/* File Size Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>File Size Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Object.entries(sizeBands).map(([band, count]) => (
            <div key={band} className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">{band}</span>
                <Badge variant="outline">{count} files</Badge>
              </div>
              <Progress value={(count / totalFiles) * 100} className="h-2" />
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
