import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  Folder,
  FolderOpen,
  File as FileIcon,
  Package,
  Wrench,
  TestTube,
} from 'lucide-react';
import type { Archive, File, FileTreeNode, AnalysisResult } from '@shared/schema';
import { buildFileTree } from '@/lib/file-analyzer';

interface FileTreeProps {
  files: File[];
  selectedFile: File | null;
  onFileSelect: (file: File) => void;
  archive: Archive | null;
  archives: Archive[];
  onArchiveSelect: (archive: Archive) => void;
}

export default function FileTree({
  files,
  selectedFile,
  onFileSelect,
  archive,
  archives,
  onArchiveSelect,
}: FileTreeProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(new Set());
  const [selectedFilter, setSelectedFilter] = useState('All');

  const fileTree = buildFileTree(files);
  const analysis = analyzeFiles(files);

  const filteredFiles = files.filter(file => {
    const matchesSearch =
      !searchQuery ||
      file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.path.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter =
      selectedFilter === 'All' ||
      file.language === selectedFilter ||
      file.tags?.includes(selectedFilter.toLowerCase());

    return matchesSearch && matchesFilter;
  });

  const toggleExpanded = (path: string) => {
    const newExpanded = new Set(expandedPaths);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedPaths(newExpanded);
  };

  const getFileIcon = (file: File) => {
    if (file.isDirectory === 'true') {
      return expandedPaths.has(file.path) ? FolderOpen : Folder;
    }

    const ext = file.extension?.toLowerCase();
    switch (ext) {
      case '.js':
      case '.jsx':
      case '.ts':
      case '.tsx':
        return () => (
          <div className="w-4 h-4 bg-yellow-500 rounded text-white text-xs flex items-center justify-center font-bold">
            JS
          </div>
        );
      case '.py':
        return () => (
          <div className="w-4 h-4 bg-blue-500 rounded text-white text-xs flex items-center justify-center font-bold">
            PY
          </div>
        );
      case '.java':
        return () => (
          <div className="w-4 h-4 bg-red-500 rounded text-white text-xs flex items-center justify-center font-bold">
            JA
          </div>
        );
      default:
        return FileIcon;
    }
  };

  const getLanguageBadge = (file: File) => {
    if (file.tags?.includes('component'))
      return <Badge className="bg-purple-600 text-white text-xs">React</Badge>;
    if (file.tags?.includes('utility'))
      return <Badge className="bg-green-600 text-white text-xs">Utilities</Badge>;
    if (file.tags?.includes('test'))
      return <Badge className="bg-orange-600 text-white text-xs">Test</Badge>;
    return null;
  };

  const renderTreeNode = (node: FileTreeNode, depth = 0) => {
    const file = files.find(f => f.path === node.path);
    if (!file) return null;

    const isSelected = selectedFile?.id === file.id;
    const isExpanded = expandedPaths.has(node.path);
    const Icon = getFileIcon(file);
    const badge = getLanguageBadge(file);

    return (
      <div key={node.path}>
        <div
          className={`tree-item flex items-center space-x-2 p-2 cursor-pointer rounded text-sm ${
            isSelected ? 'selected bg-blue-50 border-l-2 border-blue-600' : 'hover:bg-gray-100'
          }`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
          onClick={() => {
            if (file.isDirectory === 'true') {
              toggleExpanded(node.path);
            } else {
              onFileSelect(file);
            }
          }}
        >
          <Icon className="w-4 h-4 text-blue-600" />
          <span className="flex-1 truncate">{node.name}</span>
          {badge}
          {file.size && file.size > 0 && (
            <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)}KB</span>
          )}
        </div>

        {node.children && isExpanded && (
          <div>{node.children.map(child => renderTreeNode(child, depth + 1))}</div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Archive Selector */}
      {archives.length > 1 && (
        <div className="p-4 border-b border-gray-200">
          <select
            value={archive?.id || ''}
            onChange={e => {
              const selectedArchive = archives.find(a => a.id === e.target.value);
              if (selectedArchive) onArchiveSelect(selectedArchive);
            }}
            className="w-full p-2 border border-gray-300 rounded text-sm"
          >
            {archives.map(arch => (
              <option key={arch.id} value={arch.id}>
                {arch.name} ({arch.fileCount} files)
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Search and Filters */}
      <div className="p-4 border-b border-gray-200 space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search files and components..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-10 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {['All', 'JavaScript', 'React', 'Python', 'component', 'utility'].map(filter => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedFilter(filter)}
              className="text-xs"
            >
              {filter}
            </Button>
          ))}
        </div>
      </div>

      {/* File Tree */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        <div className="p-2">
          {archive && (
            <div className="flex items-center space-x-2 p-2 mb-2 bg-white rounded border">
              <FolderOpen className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium">{archive.name}</span>
              <span className="text-xs text-gray-500 ml-auto">{files.length} files</span>
            </div>
          )}

          {searchQuery ? (
            <div className="space-y-1">
              {filteredFiles.map(file => {
                const Icon = getFileIcon(file);
                const badge = getLanguageBadge(file);
                const isSelected = selectedFile?.id === file.id;

                return (
                  <div
                    key={file.id}
                    className={`tree-item flex items-center space-x-2 p-2 cursor-pointer rounded text-sm ${
                      isSelected
                        ? 'selected bg-blue-50 border-l-2 border-blue-600'
                        : 'hover:bg-gray-100'
                    }`}
                    onClick={() => file.isDirectory !== 'true' && onFileSelect(file)}
                  >
                    <Icon className="w-4 h-4 text-blue-600" />
                    <span className="flex-1 truncate">{file.path}</span>
                    {badge}
                    {file.size && file.size > 0 && (
                      <span className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)}KB
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="space-y-1">{fileTree.map(node => renderTreeNode(node))}</div>
          )}
        </div>
      </div>

      {/* Analysis Summary */}
      <div className="p-4 border-t border-gray-200 bg-white">
        <h3 className="text-sm font-medium text-gray-900 mb-3">Analysis Summary</h3>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium text-gray-900">{analysis.totalFiles}</div>
            <div className="text-gray-500">Files</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium text-blue-600">{analysis.components}</div>
            <div className="text-gray-500">Components</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium text-purple-600">{analysis.modules}</div>
            <div className="text-gray-500">Modules</div>
          </div>
          <div className="text-center p-2 bg-gray-50 rounded">
            <div className="font-medium text-green-600">{analysis.utilities}</div>
            <div className="text-gray-500">Utilities</div>
          </div>
        </div>
      </div>
    </>
  );
}

function analyzeFiles(files: File[]): AnalysisResult {
  const totalFiles = files.filter(f => f.isDirectory !== 'true').length;
  const components = files.filter(f => f.tags?.includes('component')).length;
  const modules = files.filter(f => f.tags?.includes('module')).length;
  const utilities = files.filter(f => f.tags?.includes('utility')).length;

  const languages: Record<string, number> = {};
  files.forEach(file => {
    if (file.language) {
      languages[file.language] = (languages[file.language] || 0) + 1;
    }
  });

  return {
    totalFiles,
    components,
    modules,
    utilities,
    languages,
  };
}
