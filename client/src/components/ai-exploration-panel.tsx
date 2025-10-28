import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Brain,
  Search,
  Zap,
  Download,
  FileCode,
  Lock,
  Network,
  TrendingUp,
  GitBranch,
  Layers,
} from 'lucide-react';
import type { Archive, File } from '@shared/schema';
import { cn } from '@/lib/utils';

interface AIExplorationPanelProps {
  archive: Archive;
  files: File[];
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
}

interface ExplorationInsight {
  type: 'critical' | 'interesting' | 'pattern' | 'suggestion';
  title: string;
  description: string;
  files?: File[];
  action?: string;
}

interface SmartCluster {
  id: string;
  name: string;
  files: File[];
  insight: string;
  priority: 'high' | 'medium' | 'low';
  category: 'security' | 'architecture' | 'data' | 'ui' | 'logic';
}

export function AIExplorationPanel({
  archive,
  files,
  onFileSelect,
  selectedFile,
}: AIExplorationPanelProps) {
  const [insights, setInsights] = useState<ExplorationInsight[]>([]);
  const [smartClusters, setSmartClusters] = useState<SmartCluster[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    generateAIInsights();
    generateSmartClusters();
  }, [files]);

  const generateAIInsights = () => {
    const newInsights: ExplorationInsight[] = [];

    // Security-related insights
    const cryptoFiles = files.filter(
      f =>
        f.name.toLowerCase().includes('crypto') ||
        f.name.toLowerCase().includes('encrypt') ||
        f.content?.toLowerCase().includes('encryption')
    );

    if (cryptoFiles.length > 0) {
      newInsights.push({
        type: 'critical',
        title: 'Encryption Implementation Detected',
        description: `Found ${cryptoFiles.length} files containing cryptographic logic. Review for security best practices.`,
        files: cryptoFiles,
        action: 'security_review',
      });
    }

    // High complexity files
    const complexFiles = files.filter(f => f.complexity === 'High');
    if (complexFiles.length > 0) {
      newInsights.push({
        type: 'interesting',
        title: 'Complex Logic Components',
        description: `${complexFiles.length} files marked as high complexity. These likely contain core business logic.`,
        files: complexFiles,
        action: 'deep_dive',
      });
    }

    // JavaScript modules pattern
    const jsModules = files.filter(f => f.language === 'JavaScript' && f.tags?.includes('module'));
    if (jsModules.length > 0) {
      newInsights.push({
        type: 'pattern',
        title: 'Modular JavaScript Architecture',
        description: `Detected ${jsModules.length} JavaScript modules with export patterns.`,
        files: jsModules,
        action: 'architecture_review',
      });
    }

    // Configuration files
    const configFiles = files.filter(
      f =>
        f.tags?.includes('config') ||
        f.name.toLowerCase().includes('config') ||
        f.extension === '.json'
    );
    if (configFiles.length > 5) {
      newInsights.push({
        type: 'suggestion',
        title: 'Configuration Management',
        description: `Multiple configuration files detected. Consider consolidation strategies.`,
        files: configFiles.slice(0, 5),
        action: 'config_audit',
      });
    }

    setInsights(newInsights);
  };

  const generateSmartClusters = () => {
    const clusters: SmartCluster[] = [];

    // Security cluster
    const securityFiles = files.filter(
      f =>
        f.name.toLowerCase().includes('crypto') ||
        f.name.toLowerCase().includes('encrypt') ||
        f.name.toLowerCase().includes('auth') ||
        f.name.toLowerCase().includes('security') ||
        f.name.toLowerCase().includes('seal')
    );

    if (securityFiles.length > 0) {
      clusters.push({
        id: 'security',
        name: 'Security & Encryption',
        files: securityFiles,
        insight: 'Critical security implementations requiring careful review',
        priority: 'high',
        category: 'security',
      });
    }

    // Core logic cluster
    const coreFiles = files.filter(
      f => f.complexity === 'High' || f.tags?.includes('module') || f.language === 'JavaScript'
    );

    if (coreFiles.length > 0) {
      clusters.push({
        id: 'core',
        name: 'Core Logic',
        files: coreFiles,
        insight: 'Main application logic and business rules',
        priority: 'high',
        category: 'logic',
      });
    }

    // Data structures cluster
    const dataFiles = files.filter(
      f =>
        f.extension === '.json' ||
        f.name.toLowerCase().includes('data') ||
        f.name.toLowerCase().includes('schema') ||
        f.name.toLowerCase().includes('registry')
    );

    if (dataFiles.length > 0) {
      clusters.push({
        id: 'data',
        name: 'Data Structures',
        files: dataFiles,
        insight: 'Configuration and data definition files',
        priority: 'medium',
        category: 'data',
      });
    }

    // Bundle cluster
    const bundleFiles = files.filter(
      f =>
        f.name.toLowerCase().includes('bundle') ||
        f.name.toLowerCase().includes('repo') ||
        f.name.toLowerCase().includes('export')
    );

    if (bundleFiles.length > 0) {
      clusters.push({
        id: 'bundles',
        name: 'Archive Bundles',
        files: bundleFiles,
        insight: 'Nested archives and repository exports',
        priority: 'low',
        category: 'architecture',
      });
    }

    setSmartClusters(clusters);
  };

  const handleExportArchive = async () => {
    setIsAnalyzing(true);
    try {
      const response = await fetch(`/api/v1/archives/${archive.id}/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${archive.name.replace('.zip', '')}-zipwizard-export.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getCategoryIcon = (category: SmartCluster['category']) => {
    switch (category) {
      case 'security':
        return Lock;
      case 'architecture':
        return Network;
      case 'data':
        return Layers;
      case 'ui':
        return FileCode;
      case 'logic':
        return GitBranch;
      default:
        return FileCode;
    }
  };

  const getPriorityColor = (priority: SmartCluster['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="w-96 bg-gradient-to-br from-purple-50 to-blue-50 border-l border-purple-200 flex flex-col">
      <div className="p-4 border-b border-purple-200 bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <div className="flex items-center space-x-2">
          <Brain className="w-5 h-5" />
          <h3 className="font-semibold">AI Exploration</h3>
          <Badge variant="secondary" className="bg-white/20 text-white">
            v2.2.6b
          </Badge>
        </div>
        <p className="text-sm text-purple-100 mt-1">
          Quantum-enhanced analysis for {files.length} files
        </p>
      </div>

      <Tabs defaultValue="insights" className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 m-2">
          <TabsTrigger value="insights" className="text-xs">
            <Zap className="w-3 h-3 mr-1" />
            Insights
          </TabsTrigger>
          <TabsTrigger value="clusters" className="text-xs">
            <Layers className="w-3 h-3 mr-1" />
            Clusters
          </TabsTrigger>
          <TabsTrigger value="export" className="text-xs">
            <Download className="w-3 h-3 mr-1" />
            Export
          </TabsTrigger>
        </TabsList>

        <TabsContent value="insights" className="flex-1 m-2">
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {insights.map((insight, index) => (
                <Card
                  key={index}
                  className={cn(
                    'cursor-pointer transition-all hover:shadow-md',
                    insight.type === 'critical' && 'border-red-200 bg-red-50',
                    insight.type === 'interesting' && 'border-blue-200 bg-blue-50',
                    insight.type === 'pattern' && 'border-purple-200 bg-purple-50',
                    insight.type === 'suggestion' && 'border-green-200 bg-green-50'
                  )}
                >
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center space-x-2">
                      <TrendingUp className="w-4 h-4" />
                      <span>{insight.title}</span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-xs text-gray-600 mb-2">{insight.description}</p>
                    {insight.files && (
                      <div className="space-y-1">
                        {insight.files.slice(0, 3).map(file => (
                          <Button
                            key={file.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-6 text-xs"
                            onClick={() => onFileSelect(file)}
                          >
                            <FileCode className="w-3 h-3 mr-1" />
                            {file.name}
                          </Button>
                        ))}
                        {insight.files.length > 3 && (
                          <p className="text-xs text-gray-500">
                            +{insight.files.length - 3} more files
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="clusters" className="flex-1 m-2">
          <ScrollArea className="h-full">
            <div className="space-y-3">
              {smartClusters.map(cluster => {
                const Icon = getCategoryIcon(cluster.category);
                return (
                  <Card key={cluster.id} className="cursor-pointer hover:shadow-md transition-all">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Icon className="w-4 h-4" />
                          <span>{cluster.name}</span>
                        </div>
                        <Badge className={getPriorityColor(cluster.priority)} variant="outline">
                          {cluster.priority}
                        </Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xs text-gray-600 mb-2">{cluster.insight}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                        <span>{cluster.files.length} files</span>
                        <Badge variant="outline" className="text-xs">
                          {cluster.category}
                        </Badge>
                      </div>
                      <div className="space-y-1">
                        {cluster.files.slice(0, 4).map(file => (
                          <Button
                            key={file.id}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-6 text-xs"
                            onClick={() => onFileSelect(file)}
                          >
                            <FileCode className="w-3 h-3 mr-1" />
                            {file.name}
                          </Button>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        <TabsContent value="export" className="flex-1 m-2">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>AI-Optimized Export</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-gray-600 mb-4">
                  Export includes analysis results, quantum features, and AI exploration paths
                  optimized for both human and AI consumption.
                </p>
                <Button
                  onClick={handleExportArchive}
                  disabled={isAnalyzing}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                >
                  {isAnalyzing ? (
                    <>
                      <Brain className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4 mr-2" />
                      Export Analysis
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Export Features</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-xs">
                  <div className="flex items-center space-x-2">
                    <Zap className="w-3 h-3 text-purple-600" />
                    <span>Quantum analysis metadata</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Brain className="w-3 h-3 text-blue-600" />
                    <span>AI exploration recommendations</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Network className="w-3 h-3 text-green-600" />
                    <span>File relationship mapping</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Lock className="w-3 h-3 text-red-600" />
                    <span>Security insights & patterns</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
