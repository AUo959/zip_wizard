import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Download,
  Eye,
  EyeOff,
  CircleDot,
  AlertTriangle,
} from 'lucide-react';

interface DependencyGraphProps {
  files?: any[];
  onNodeClick?: (node: GraphNode) => void;
  onAnalysisComplete?: (analysis: DependencyAnalysis) => void;
}

interface GraphNode {
  id: string;
  name: string;
  type: 'file' | 'module' | 'external';
  dependencies: string[];
  dependents: string[];
  size: number;
  complexity?: string;
  language?: string;
  x?: number;
  y?: number;
}

interface GraphEdge {
  source: string;
  target: string;
  type: 'import' | 'require' | 'include';
}

interface DependencyAnalysis {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: DependencyCluster[];
  circularDependencies: string[][];
  orphanFiles: string[];
  hubFiles: string[];
}

interface DependencyCluster {
  id: string;
  name: string;
  nodes: string[];
  cohesion: number;
  coupling: number;
}

const IMPORT_PATTERNS = [
  // JavaScript/TypeScript
  /import\s+(?:(?:\{[^}]*\})|(?:\*\s+as\s+\w+)|(?:\w+))\s+from\s+['"]([^'"]+)['"]/g,
  /require\s*\(['"]([^'"]+)['"]\)/g,
  // Python
  /from\s+(\S+)\s+import/g,
  /import\s+(\S+)/g,
  // Java
  /import\s+([\w.]+);/g,
  // C/C++
  /#include\s+[<"]([^>"]+)[>"]/g,
  // Go
  /import\s+(?:\(\s*)?["']([^"']+)["']/g,
  // Rust
  /use\s+([\w:]+)/g,
];

export function DependencyGraph({
  files = [],
  onNodeClick,
  onAnalysisComplete,
}: DependencyGraphProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [analysis, setAnalysis] = useState<DependencyAnalysis | null>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [showLabels, setShowLabels] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'circular' | 'orphan' | 'hub'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const extractDependencies = useCallback((file: any): string[] => {
    const dependencies: string[] = [];
    const content = file.content || '';

    if (!content) return dependencies;

    IMPORT_PATTERNS.forEach(pattern => {
      const matches = content.matchAll(new RegExp(pattern));
      for (const match of matches) {
        if (match[1]) {
          // Clean up the dependency path
          let dep = match[1]
            .replace(/^\.\//, '')
            .replace(/^@\//, '')
            .replace(/\.(js|ts|jsx|tsx|py|java|cpp|h|go|rs)$/, '');

          // Filter out external dependencies (node_modules, standard library)
          if (!dep.startsWith('.') && !dep.includes('/')) {
            // External dependency
            dependencies.push(`external:${dep}`);
          } else {
            // Internal dependency
            dependencies.push(dep);
          }
        }
      }
    });

    return Array.from(new Set(dependencies)); // Remove duplicates
  }, []);

  const analyzeDependencies = useCallback(() => {
    const nodes: Map<string, GraphNode> = new Map();
    const edges: GraphEdge[] = [];

    // Create nodes for all files
    files.forEach(file => {
      const fileId = file.path || file.name;
      const dependencies = extractDependencies(file);

      nodes.set(fileId, {
        id: fileId,
        name: file.name,
        type: 'file',
        dependencies,
        dependents: [],
        size: file.size || 1000,
        complexity: file.complexity,
        language: file.language,
      });
    });

    // Build edges and dependents
    nodes.forEach((node, nodeId) => {
      node.dependencies.forEach(dep => {
        if (dep.startsWith('external:')) {
          // Create external dependency node if not exists
          if (!nodes.has(dep)) {
            nodes.set(dep, {
              id: dep,
              name: dep.replace('external:', ''),
              type: 'external',
              dependencies: [],
              dependents: [],
              size: 500,
            });
          }
        }

        // Create edge
        edges.push({
          source: nodeId,
          target: dep,
          type: 'import',
        });

        // Update dependents
        const targetNode = nodes.get(dep);
        if (targetNode) {
          targetNode.dependents.push(nodeId);
        }
      });
    });

    // Detect circular dependencies
    const circularDependencies = detectCircularDependencies(nodes);

    // Find orphan files (no dependencies and no dependents)
    const orphanFiles = Array.from(nodes.values())
      .filter(
        node =>
          node.type === 'file' && node.dependencies.length === 0 && node.dependents.length === 0
      )
      .map(node => node.id);

    // Find hub files (many dependents)
    const hubFiles = Array.from(nodes.values())
      .filter(node => node.dependents.length > 5)
      .sort((a, b) => b.dependents.length - a.dependents.length)
      .slice(0, 5)
      .map(node => node.id);

    // Create clusters
    const clusters = createClusters(nodes, edges);

    // Position nodes using force-directed layout
    positionNodes(nodes, edges);

    const analysisResult: DependencyAnalysis = {
      nodes: Array.from(nodes.values()),
      edges,
      clusters,
      circularDependencies,
      orphanFiles,
      hubFiles,
    };

    setAnalysis(analysisResult);
    onAnalysisComplete?.(analysisResult);
  }, [files, extractDependencies, onAnalysisComplete]);

  const detectCircularDependencies = (nodes: Map<string, GraphNode>): string[][] => {
    const circular: string[][] = [];
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const dfs = (nodeId: string, path: string[]): void => {
      visited.add(nodeId);
      recursionStack.add(nodeId);

      const node = nodes.get(nodeId);
      if (node) {
        node.dependencies.forEach(dep => {
          if (!visited.has(dep)) {
            dfs(dep, [...path, dep]);
          } else if (recursionStack.has(dep)) {
            // Found circular dependency
            const cycleStart = path.indexOf(dep);
            if (cycleStart !== -1) {
              circular.push(path.slice(cycleStart));
            }
          }
        });
      }

      recursionStack.delete(nodeId);
    };

    nodes.forEach((_, nodeId) => {
      if (!visited.has(nodeId)) {
        dfs(nodeId, [nodeId]);
      }
    });

    return circular;
  };

  const createClusters = (
    nodes: Map<string, GraphNode>,
    edges: GraphEdge[]
  ): DependencyCluster[] => {
    // Simple clustering based on directory structure
    const clusters = new Map<string, DependencyCluster>();

    nodes.forEach(node => {
      if (node.type === 'file') {
        const parts = node.id.split('/');
        if (parts.length > 1) {
          const clusterName = parts[0];

          if (!clusters.has(clusterName)) {
            clusters.set(clusterName, {
              id: clusterName,
              name: clusterName,
              nodes: [],
              cohesion: 0,
              coupling: 0,
            });
          }

          clusters.get(clusterName)!.nodes.push(node.id);
        }
      }
    });

    // Calculate cohesion and coupling
    clusters.forEach(cluster => {
      const clusterNodes = cluster.nodes;
      let internalEdges = 0;
      let externalEdges = 0;

      edges.forEach(edge => {
        const sourceInCluster = clusterNodes.includes(edge.source);
        const targetInCluster = clusterNodes.includes(edge.target);

        if (sourceInCluster && targetInCluster) {
          internalEdges++;
        } else if (sourceInCluster || targetInCluster) {
          externalEdges++;
        }
      });

      cluster.cohesion =
        clusterNodes.length > 1
          ? internalEdges / (clusterNodes.length * (clusterNodes.length - 1))
          : 0;
      cluster.coupling = externalEdges / Math.max(1, internalEdges + externalEdges);
    });

    return Array.from(clusters.values());
  };

  const positionNodes = (nodes: Map<string, GraphNode>, edges: GraphEdge[]) => {
    const width = 800;
    const height = 600;
    const nodeArray = Array.from(nodes.values());

    // Simple force-directed layout simulation
    nodeArray.forEach((node, i) => {
      const angle = (i / nodeArray.length) * 2 * Math.PI;
      const radius = 200 + Math.random() * 100;
      node.x = width / 2 + Math.cos(angle) * radius;
      node.y = height / 2 + Math.sin(angle) * radius;
    });

    // Simulate forces
    for (let iteration = 0; iteration < 50; iteration++) {
      // Repulsion between all nodes
      for (let i = 0; i < nodeArray.length; i++) {
        for (let j = i + 1; j < nodeArray.length; j++) {
          const dx = nodeArray[j].x! - nodeArray[i].x!;
          const dy = nodeArray[j].y! - nodeArray[i].y!;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 0 && distance < 100) {
            const force = 50 / distance;
            nodeArray[i].x! -= (dx * force) / distance;
            nodeArray[i].y! -= (dy * force) / distance;
            nodeArray[j].x! += (dx * force) / distance;
            nodeArray[j].y! += (dy * force) / distance;
          }
        }
      }

      // Attraction along edges
      edges.forEach(edge => {
        const source = nodes.get(edge.source);
        const target = nodes.get(edge.target);

        if (source && target && source.x && source.y && target.x && target.y) {
          const dx = target.x - source.x;
          const dy = target.y - source.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 150) {
            const force = (distance - 150) * 0.01;
            source.x += (dx * force) / distance;
            source.y += (dy * force) / distance;
            target.x -= (dx * force) / distance;
            target.y -= (dy * force) / distance;
          }
        }
      });
    }
  };

  const drawGraph = useCallback(() => {
    if (!canvasRef.current || !analysis) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Apply zoom and offset
    ctx.save();
    ctx.translate(offset.x, offset.y);
    ctx.scale(zoom, zoom);

    // Filter nodes based on current filter
    let visibleNodes = analysis.nodes;
    if (filterType === 'circular') {
      const circularNodeIds = new Set(analysis.circularDependencies.flat());
      visibleNodes = analysis.nodes.filter(n => circularNodeIds.has(n.id));
    } else if (filterType === 'orphan') {
      visibleNodes = analysis.nodes.filter(n => analysis.orphanFiles.includes(n.id));
    } else if (filterType === 'hub') {
      visibleNodes = analysis.nodes.filter(n => analysis.hubFiles.includes(n.id));
    }

    // Draw edges
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    analysis.edges.forEach(edge => {
      const source = analysis.nodes.find(n => n.id === edge.source);
      const target = analysis.nodes.find(n => n.id === edge.target);

      if (
        source &&
        target &&
        source.x &&
        source.y &&
        target.x &&
        target.y &&
        visibleNodes.includes(source) &&
        visibleNodes.includes(target)
      ) {
        ctx.beginPath();
        ctx.moveTo(source.x, source.y);
        ctx.lineTo(target.x, target.y);
        ctx.stroke();

        // Draw arrow
        const angle = Math.atan2(target.y - source.y, target.x - source.x);
        const arrowSize = 5;
        ctx.save();
        ctx.translate(target.x - Math.cos(angle) * 20, target.y - Math.sin(angle) * 20);
        ctx.rotate(angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-arrowSize, -arrowSize / 2);
        ctx.lineTo(-arrowSize, arrowSize / 2);
        ctx.closePath();
        ctx.fillStyle = '#888';
        ctx.fill();
        ctx.restore();
      }
    });

    // Draw nodes
    visibleNodes.forEach(node => {
      if (!node.x || !node.y) return;

      // Node color based on type
      if (node.type === 'external') {
        ctx.fillStyle = '#9ca3af'; // Gray for external
      } else if (analysis.circularDependencies.flat().includes(node.id)) {
        ctx.fillStyle = '#ef4444'; // Red for circular
      } else if (analysis.hubFiles.includes(node.id)) {
        ctx.fillStyle = '#3b82f6'; // Blue for hubs
      } else if (analysis.orphanFiles.includes(node.id)) {
        ctx.fillStyle = '#f59e0b'; // Orange for orphans
      } else {
        ctx.fillStyle = '#10b981'; // Green for normal
      }

      // Draw node circle
      const radius = Math.sqrt(node.size / 100) + 5;
      ctx.beginPath();
      ctx.arc(node.x, node.y, radius, 0, 2 * Math.PI);
      ctx.fill();

      // Highlight selected node
      if (selectedNode?.id === node.id) {
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      // Draw label
      if (showLabels) {
        ctx.fillStyle = '#000';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(node.name, node.x, node.y + radius + 12);
      }
    });

    ctx.restore();
  }, [analysis, zoom, offset, showLabels, filterType, selectedNode]);

  useEffect(() => {
    if (files.length > 0) {
      analyzeDependencies();
    }
  }, [files, analyzeDependencies]);

  useEffect(() => {
    drawGraph();
  }, [drawGraph]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !analysis) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - offset.x) / zoom;
    const y = (e.clientY - rect.top - offset.y) / zoom;

    // Find clicked node
    const clickedNode = analysis.nodes.find(node => {
      if (!node.x || !node.y) return false;
      const radius = Math.sqrt(node.size / 100) + 5;
      const distance = Math.sqrt(Math.pow(x - node.x, 2) + Math.pow(y - node.y, 2));
      return distance <= radius;
    });

    if (clickedNode) {
      setSelectedNode(clickedNode);
      onNodeClick?.(clickedNode);
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDragging) {
      setOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const exportGraph = () => {
    if (!analysis) return;

    const data = {
      nodes: analysis.nodes.map(n => ({
        id: n.id,
        name: n.name,
        type: n.type,
        dependencies: n.dependencies,
        dependents: n.dependents,
      })),
      edges: analysis.edges,
      clusters: analysis.clusters,
      circularDependencies: analysis.circularDependencies,
      orphanFiles: analysis.orphanFiles,
      hubFiles: analysis.hubFiles,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `dependency-graph-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="w-5 h-5 text-blue-600" />
            Dependency Graph Visualization
            <Badge variant="outline" className="ml-auto">
              Interactive
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.min(z + 0.2, 3))}
              >
                <ZoomIn className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}
              >
                <ZoomOut className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setZoom(1);
                  setOffset({ x: 0, y: 0 });
                }}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={() => setShowLabels(!showLabels)}>
                {showLabels ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </Button>
            </div>

            <div className="flex gap-2">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value as any)}
                className="text-sm border rounded px-2 py-1"
              >
                <option value="all">All Nodes</option>
                <option value="circular">Circular Dependencies</option>
                <option value="orphan">Orphan Files</option>
                <option value="hub">Hub Files</option>
              </select>

              <Button variant="outline" size="sm" onClick={exportGraph} disabled={!analysis}>
                <Download className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Graph Canvas */}
          <div className="border rounded-lg overflow-hidden bg-gray-50">
            <canvas
              ref={canvasRef}
              width={800}
              height={600}
              className="cursor-move"
              onClick={handleCanvasClick}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onMouseLeave={handleMouseUp}
            />
          </div>

          {/* Analysis Results */}
          {analysis && (
            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="issues">Issues</TabsTrigger>
                <TabsTrigger value="clusters">Clusters</TabsTrigger>
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-3">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-lg font-bold">{analysis.nodes.length}</div>
                      <div className="text-xs text-muted-foreground">Total Nodes</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-lg font-bold">{analysis.edges.length}</div>
                      <div className="text-xs text-muted-foreground">Dependencies</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-lg font-bold">{analysis.clusters.length}</div>
                      <div className="text-xs text-muted-foreground">Clusters</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-3 text-center">
                      <div className="text-lg font-bold text-red-600">
                        {analysis.circularDependencies.length}
                      </div>
                      <div className="text-xs text-muted-foreground">Circular Deps</div>
                    </CardContent>
                  </Card>
                </div>

                <div className="flex gap-2 flex-wrap">
                  <Badge className="bg-green-100 text-green-800">
                    <CircleDot className="w-3 h-3 mr-1" />
                    Normal Files
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-800">
                    <CircleDot className="w-3 h-3 mr-1" />
                    Hub Files (High Connectivity)
                  </Badge>
                  <Badge className="bg-orange-100 text-orange-800">
                    <CircleDot className="w-3 h-3 mr-1" />
                    Orphan Files
                  </Badge>
                  <Badge className="bg-red-100 text-red-800">
                    <CircleDot className="w-3 h-3 mr-1" />
                    Circular Dependencies
                  </Badge>
                  <Badge className="bg-gray-100 text-gray-800">
                    <CircleDot className="w-3 h-3 mr-1" />
                    External Dependencies
                  </Badge>
                </div>
              </TabsContent>

              <TabsContent value="issues" className="space-y-3">
                {analysis.circularDependencies.length > 0 && (
                  <Alert>
                    <AlertTriangle className="w-4 h-4" />
                    <AlertDescription>
                      <strong>Circular Dependencies Detected:</strong>
                      <ul className="mt-2 space-y-1">
                        {analysis.circularDependencies.map((cycle, i) => (
                          <li key={i} className="text-sm">
                            {cycle.join(' → ')} → {cycle[0]}
                          </li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {analysis.orphanFiles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Orphan Files</h4>
                    <div className="space-y-1">
                      {analysis.orphanFiles.map(file => (
                        <Badge key={file} variant="outline" className="mr-2">
                          {file}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {analysis.hubFiles.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Hub Files (High Dependency)</h4>
                    <div className="space-y-1">
                      {analysis.hubFiles.map(file => {
                        const node = analysis.nodes.find(n => n.id === file);
                        return (
                          <div key={file} className="flex items-center gap-2">
                            <Badge variant="outline">{file}</Badge>
                            <span className="text-xs text-muted-foreground">
                              {node?.dependents.length} dependents
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="clusters" className="space-y-3">
                {analysis.clusters.map(cluster => (
                  <Card key={cluster.id}>
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{cluster.name}</span>
                        <Badge variant="outline">{cluster.nodes.length} files</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>Cohesion: {(cluster.cohesion * 100).toFixed(1)}%</div>
                        <div>Coupling: {(cluster.coupling * 100).toFixed(1)}%</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="details" className="space-y-3">
                {selectedNode ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{selectedNode.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>Type: {selectedNode.type}</div>
                        <div>Size: {selectedNode.size} bytes</div>
                        {selectedNode.language && <div>Language: {selectedNode.language}</div>}
                        {selectedNode.complexity && (
                          <div>Complexity: {selectedNode.complexity}</div>
                        )}
                      </div>

                      {selectedNode.dependencies.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">
                            Dependencies ({selectedNode.dependencies.length})
                          </h4>
                          <div className="space-x-1">
                            {selectedNode.dependencies.map(dep => (
                              <Badge key={dep} variant="outline" className="text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {selectedNode.dependents.length > 0 && (
                        <div>
                          <h4 className="text-sm font-medium mb-1">
                            Dependents ({selectedNode.dependents.length})
                          </h4>
                          <div className="space-x-1">
                            {selectedNode.dependents.map(dep => (
                              <Badge key={dep} variant="outline" className="text-xs">
                                {dep}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Click on a node to view details
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
