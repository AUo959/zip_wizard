import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Search,
  Folder,
  File as FileIcon,
  Code,
  Database,
  Shield,
  Layers,
  TrendingUp,
  Zap,
  Copy,
} from 'lucide-react';
import type { Archive, File } from '@shared/schema';
import { cn } from '@/lib/utils';
import { formatFileSize, copyToClipboard } from '@/lib/file-utils';
import { useToast } from '@/hooks/use-toast';

interface EnhancedFileTreeProps {
  files: File[];
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  archive: Archive;
}

interface SmartGroup {
  id: string;
  name: string;
  files: File[];
  icon: any;
  color: string;
  priority: number;
}

export function EnhancedFileTree({
  files,
  selectedFile,
  onFileSelect,
  archive,
}: EnhancedFileTreeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGroup, setSelectedGroup] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'groups' | 'insights'>('groups');
  const { toast } = useToast();

  const smartGroups = useMemo((): SmartGroup[] => {
    const groups: SmartGroup[] = [
      {
        id: 'security',
        name: 'Security & Encryption',
        files: files.filter(
          f =>
            f.name.toLowerCase().includes('crypto') ||
            f.name.toLowerCase().includes('encrypt') ||
            f.name.toLowerCase().includes('auth') ||
            f.name.toLowerCase().includes('security') ||
            f.name.toLowerCase().includes('seal')
        ),
        icon: Shield,
        color: 'bg-red-100 text-red-800 border-red-200',
        priority: 1,
      },
      {
        id: 'core-logic',
        name: 'Core Logic',
        files: files.filter(
          f => f.complexity === 'High' || f.language === 'JavaScript' || f.tags?.includes('module')
        ),
        icon: Code,
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        priority: 2,
      },
      {
        id: 'data-config',
        name: 'Data & Configuration',
        files: files.filter(
          f =>
            f.extension === '.json' ||
            f.name.toLowerCase().includes('config') ||
            f.name.toLowerCase().includes('registry') ||
            f.name.toLowerCase().includes('data')
        ),
        icon: Database,
        color: 'bg-green-100 text-green-800 border-green-200',
        priority: 3,
      },
      {
        id: 'archives',
        name: 'Archive Bundles',
        files: files.filter(
          f =>
            f.name.toLowerCase().includes('bundle') ||
            f.name.toLowerCase().includes('repo') ||
            f.name.toLowerCase().includes('export') ||
            f.name.toLowerCase().includes('backup')
        ),
        icon: Layers,
        color: 'bg-purple-100 text-purple-800 border-purple-200',
        priority: 4,
      },
      {
        id: 'documentation',
        name: 'Documentation',
        files: files.filter(
          f =>
            f.extension === '.md' ||
            f.name.toLowerCase().includes('readme') ||
            f.name.toLowerCase().includes('doc') ||
            f.name.toLowerCase().includes('license')
        ),
        icon: FileIcon,
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        priority: 5,
      },
    ];

    return groups.filter(g => g.files.length > 0).sort((a, b) => a.priority - b.priority);
  }, [files]);

  const filteredFiles = useMemo(() => {
    let filtered = files;

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(
        file =>
          file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
          file.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply group filter
    if (selectedGroup !== 'all') {
      const group = smartGroups.find(g => g.id === selectedGroup);
      filtered = group ? group.files : [];
    }

    return filtered;
  }, [files, searchQuery, selectedGroup, smartGroups]);

  const getFileIcon = (file: File) => {
    if (file.isDirectory === 'true') {
      return Folder;
    }

    const ext = file.extension?.toLowerCase();
    const isSecurity =
      file.name.toLowerCase().includes('crypto') ||
      file.name.toLowerCase().includes('security') ||
      file.name.toLowerCase().includes('encrypt');

    if (isSecurity) {
      return () => (
        <div className="w-4 h-4 file-type-security rounded text-xs flex items-center justify-center font-bold">
          SEC
        </div>
      );
    }

    switch (ext) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        return () => (
          <div className="w-4 h-4 file-type-js rounded text-xs flex items-center justify-center font-bold">
            JS
          </div>
        );
      case '.json':
        return () => (
          <div className="w-4 h-4 file-type-json rounded text-xs flex items-center justify-center font-bold">
            JSON
          </div>
        );
      case '.md':
        return () => (
          <div className="w-4 h-4 file-type-md rounded text-xs flex items-center justify-center font-bold">
            MD
          </div>
        );
      default:
        return () => (
          <div className="w-4 h-4 file-type-config rounded text-xs flex items-center justify-center font-bold">
            FILE
          </div>
        );
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'High':
        return 'complexity-high';
      case 'Medium':
        return 'complexity-medium';
      case 'Low':
        return 'complexity-low';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const renderGroupView = () => (
    <div className="space-y-4">
      {smartGroups.map(group => {
        const Icon = group.icon;
        const groupFiles =
          selectedGroup === 'all' || selectedGroup === group.id
            ? group.files.filter(
                f =>
                  !searchQuery ||
                  f.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  f.path.toLowerCase().includes(searchQuery.toLowerCase())
              )
            : [];

        if (selectedGroup !== 'all' && selectedGroup !== group.id) return null;
        if (searchQuery && groupFiles.length === 0) return null;

        return (
          <Card
            key={group.id}
            className="transition-all hover:shadow-md vscode-hover bg-card border-border"
          >
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center justify-between text-card-foreground">
                <div className="flex items-center space-x-2">
                  <Icon
                    className="w-4 h-4"
                    style={{
                      color: `hsl(var(--${group.id === 'security' ? 'destructive' : group.id === 'core-logic' ? 'primary' : group.id === 'data-config' ? 'secondary' : group.id === 'archives' ? 'purple' : 'info'}))`,
                    }}
                  />
                  <span>{group.name}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge className={`${group.color} font-semibold`} variant="outline">
                    {group.files.length} files
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {formatFileSize(group.files.reduce((total, file) => total + file.size, 0))}
                  </span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 max-h-64 overflow-y-auto">
                {groupFiles.slice(0, 10).map(file => {
                  const FileIcon = getFileIcon(file);
                  const isSelected = selectedFile?.id === file.id;

                  return (
                    <div
                      key={file.id}
                      className={cn(
                        'w-full flex items-center justify-start h-8 text-xs file-tree-item transition-all group hover:bg-accent/10 rounded-md px-2',
                        isSelected &&
                          'selected bg-accent/10 border-l-3 border-accent text-foreground'
                      )}
                    >
                      <div
                        className="flex-1 flex items-center cursor-pointer"
                        onClick={() => onFileSelect(file)}
                      >
                        <FileIcon className="w-3 h-3 mr-2" />
                        <div className="flex-1 flex items-center justify-between min-w-0">
                          <span className="truncate text-left">{file.name}</span>
                          <span className="text-xs text-muted-foreground opacity-70 ml-2">
                            {formatFileSize(file.size)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-1 ml-2">
                        <button
                          className="h-5 w-5 p-0 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-accent rounded flex items-center justify-center"
                          onClick={e => {
                            e.stopPropagation();
                            copyToClipboard(file.name);
                            toast({
                              title: 'Copied!',
                              description: `File name "${file.name}" copied to clipboard`,
                            });
                          }}
                          title="Copy file name"
                        >
                          <Copy className="w-3 h-3" />
                        </button>

                        {file.complexity && (
                          <Badge
                            className={cn('text-xs', getComplexityColor(file.complexity))}
                            variant="outline"
                          >
                            {file.complexity}
                          </Badge>
                        )}
                      </div>
                    </div>
                  );
                })}
                {groupFiles.length > 10 && (
                  <p className="text-xs text-gray-500 pl-2">+{groupFiles.length - 10} more files</p>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const renderInsightsView = () => (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center space-x-2">
            <TrendingUp className="w-4 h-4" />
            <span>Archive Insights</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span>Total Files</span>
              <Badge variant="outline">{files.length}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>JavaScript Modules</span>
              <Badge variant="outline">
                {files.filter(f => f.language === 'JavaScript').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>High Complexity</span>
              <Badge variant="outline" className="bg-red-100 text-red-800">
                {files.filter(f => f.complexity === 'High').length}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span>Security Files</span>
              <Badge variant="outline" className="bg-orange-100 text-orange-800">
                {
                  files.filter(
                    f =>
                      f.name.toLowerCase().includes('crypto') ||
                      f.name.toLowerCase().includes('security')
                  ).length
                }
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start vscode-hover border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => {
                const cryptoFiles = files.filter(f => f.name.toLowerCase().includes('crypto'));
                if (cryptoFiles.length > 0) onFileSelect(cryptoFiles[0]);
              }}
            >
              <Shield className="w-3 h-3 mr-2" />
              Review Security
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start vscode-hover border-primary/30 text-primary hover:bg-primary/10"
              onClick={() => {
                const complexFiles = files.filter(f => f.complexity === 'High');
                if (complexFiles.length > 0) onFileSelect(complexFiles[0]);
              }}
            >
              <Code className="w-3 h-3 mr-2" />
              Analyze Core Logic
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="w-full justify-start vscode-hover border-warning/30 text-warning hover:bg-warning/10"
              onClick={() => {
                const jsFiles = files.filter(f => f.language === 'JavaScript');
                if (jsFiles.length > 0) onFileSelect(jsFiles[0]);
              }}
            >
              <Zap className="w-3 h-3 mr-2" />
              Explore JS Modules
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center space-x-2 mb-3">
          <Layers className="w-4 h-4 text-blue-600" />
          <h3 className="font-semibold text-sm">{archive.name}</h3>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 h-8 text-sm"
          />
        </div>

        {/* View Mode Tabs */}
        <Tabs value={viewMode} onValueChange={v => setViewMode(v as any)} className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-8">
            <TabsTrigger value="groups" className="text-xs">
              Groups
            </TabsTrigger>
            <TabsTrigger value="insights" className="text-xs">
              Insights
            </TabsTrigger>
            <TabsTrigger value="tree" className="text-xs">
              Tree
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Group Filter */}
      {viewMode === 'groups' && (
        <div className="p-2 border-b border-gray-200">
          <div className="flex flex-wrap gap-1">
            <Button
              size="sm"
              variant={selectedGroup === 'all' ? 'default' : 'ghost'}
              className="h-6 text-xs"
              onClick={() => setSelectedGroup('all')}
            >
              All
            </Button>
            {smartGroups.map(group => (
              <Button
                key={group.id}
                size="sm"
                variant={selectedGroup === group.id ? 'default' : 'ghost'}
                className="h-6 text-xs"
                onClick={() => setSelectedGroup(group.id)}
              >
                {group.name}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Content */}
      <ScrollArea className="flex-1 p-4">
        {viewMode === 'groups' && renderGroupView()}
        {viewMode === 'insights' && renderInsightsView()}
        {viewMode === 'tree' && (
          <div className="space-y-1">
            {filteredFiles.map(file => {
              const FileIcon = getFileIcon(file);
              const isSelected = selectedFile?.id === file.id;

              return (
                <Button
                  key={file.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'w-full justify-start h-8 text-xs',
                    isSelected && 'bg-blue-50 border-l-2 border-blue-600'
                  )}
                  onClick={() => onFileSelect(file)}
                >
                  <FileIcon className="w-3 h-3 mr-2" />
                  <span className="flex-1 truncate text-left">{file.name}</span>
                  {file.complexity && (
                    <Badge
                      className={cn('text-xs', getComplexityColor(file.complexity))}
                      variant="outline"
                    >
                      {file.complexity}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
