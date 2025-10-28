/**
 * Advanced FileTree Component
 *
 * Recursive, accessible file tree with infinite nesting support,
 * error indicators, lazy loading, and keyboard navigation.
 */

import React, { useState, useCallback, KeyboardEvent, useEffect } from 'react';
import {
  ChevronRight,
  ChevronDown,
  File,
  Folder,
  Archive,
  AlertCircle,
  Loader2,
  FolderOpen,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FileNode, FileTreeProps } from '@shared/archive-types';

/**
 * Individual tree node component
 */
interface TreeNodeProps {
  node: FileNode;
  depth: number;
  selected: boolean;
  onSelect: (node: FileNode) => void;
  onToggle: (nodeId: string, expanded: boolean) => void;
  onLoadChildren?: (node: FileNode) => Promise<FileNode[]>;
  renderNode?: (node: FileNode, depth: number) => React.ReactNode;
  maxDepth: number;
  searchQuery?: string;
  showErrors: boolean;
  lazyLoad: boolean;
}

const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  depth,
  selected,
  onSelect,
  onToggle,
  onLoadChildren,
  renderNode,
  maxDepth,
  searchQuery,
  showErrors,
  lazyLoad,
}) => {
  const [isExpanded, setIsExpanded] = useState(node.expanded ?? false);
  const [isLoading, setIsLoading] = useState(false);
  const [children, setChildren] = useState<FileNode[]>(node.children || []);

  const hasChildren = node.type === 'folder' || node.type === 'archive';
  const shouldShowChildren = hasChildren && isExpanded && (maxDepth === -1 || depth < maxDepth);

  // Icon selection based on node type and state
  const getIcon = () => {
    if (node.loading || isLoading) {
      return <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />;
    }

    if (node.error && showErrors) {
      return <AlertCircle className="w-4 h-4 text-destructive" />;
    }

    switch (node.type) {
      case 'folder':
        return isExpanded ? (
          <FolderOpen className="w-4 h-4 text-blue-500" />
        ) : (
          <Folder className="w-4 h-4 text-blue-500" />
        );
      case 'archive':
        return <Archive className="w-4 h-4 text-purple-500" />;
      case 'file':
      default:
        return <File className="w-4 h-4 text-muted-foreground" />;
    }
  };

  // Handle expansion toggle
  const handleToggle = async () => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    onToggle(node.id, newExpanded);

    // Lazy load children if needed
    if (newExpanded && lazyLoad && hasChildren && children.length === 0 && onLoadChildren) {
      setIsLoading(true);
      try {
        const loadedChildren = await onLoadChildren(node);
        setChildren(loadedChildren);
      } catch (error) {
        console.error('Failed to load children:', error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handle node selection
  const handleSelect = () => {
    onSelect(node);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        handleSelect();
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (hasChildren && !isExpanded) {
          handleToggle();
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (hasChildren && isExpanded) {
          handleToggle();
        }
        break;
    }
  };

  // Format file size
  const formatSize = (bytes?: number): string => {
    if (!bytes) return '';
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;
    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }
    return ` (${size.toFixed(1)} ${units[unitIndex]})`;
  };

  // Highlight search matches
  const highlightText = (text: string): React.ReactNode => {
    if (!searchQuery || !searchQuery.trim()) {
      return text;
    }

    const regex = new RegExp(`(${searchQuery})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) =>
      regex.test(part) ? (
        <mark key={index} className="bg-primary/20">
          {part}
        </mark>
      ) : (
        part
      )
    );
  };

  // Custom renderer if provided
  if (renderNode) {
    return <>{renderNode(node, depth)}</>;
  }

  return (
    <div role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      {/* Node content */}
      <div
        className={cn(
          'flex items-center space-x-2 py-1.5 px-2 rounded-md cursor-pointer',
          'hover:bg-accent transition-colors',
          selected && 'bg-accent',
          node.error && showErrors && 'border-l-2 border-destructive'
        )}
        style={{ paddingLeft: `${depth * 20 + 8}px` }}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        aria-selected={selected}
      >
        {/* Expand/collapse chevron */}
        {hasChildren && (
          <button
            onClick={e => {
              e.stopPropagation();
              handleToggle();
            }}
            className="p-0 hover:bg-accent-foreground/10 rounded"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
        )}

        {/* Spacer for nodes without children */}
        {!hasChildren && <div className="w-4" />}

        {/* Icon */}
        <div className="flex-shrink-0">{getIcon()}</div>

        {/* Name and size */}
        <div className="flex-1 min-w-0 flex items-baseline space-x-1">
          <span className="truncate" title={node.name}>
            {highlightText(node.name)}
          </span>
          {node.size !== undefined && (
            <span className="text-xs text-muted-foreground flex-shrink-0">
              {formatSize(node.size)}
            </span>
          )}
        </div>

        {/* Error indicator */}
        {node.error && showErrors && (
          <span className="text-xs text-destructive flex-shrink-0">Error</span>
        )}

        {/* Partial recovery indicator */}
        {node.partiallyRecovered && (
          <span className="text-xs text-yellow-600 dark:text-yellow-400 flex-shrink-0">
            Partial
          </span>
        )}
      </div>

      {/* Error message */}
      {node.error && showErrors && isExpanded && (
        <div
          className="text-xs text-destructive bg-destructive/10 p-2 rounded-md mx-2 my-1"
          style={{ marginLeft: `${depth * 20 + 16}px` }}
        >
          {node.error.message}
        </div>
      )}

      {/* Child nodes */}
      {shouldShowChildren && children.length > 0 && (
        <div role="group">
          {children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              selected={false}
              onSelect={onSelect}
              onToggle={onToggle}
              onLoadChildren={onLoadChildren}
              renderNode={renderNode}
              maxDepth={maxDepth}
              searchQuery={searchQuery}
              showErrors={showErrors}
              lazyLoad={lazyLoad}
            />
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * FileTree component with recursive rendering and accessibility features
 */
export const AdvancedFileTree: React.FC<FileTreeProps> = ({
  nodes,
  onNodeSelect,
  onNodeToggle,
  selectedNodeId,
  showErrors = true,
  lazyLoad = false,
  onLoadChildren,
  renderNode,
  maxDepth = -1,
  searchQuery,
  className,
}) => {
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedNodeId);

  useEffect(() => {
    setSelectedId(selectedNodeId);
  }, [selectedNodeId]);

  const handleSelect = useCallback(
    (node: FileNode) => {
      setSelectedId(node.id);
      onNodeSelect?.(node);
    },
    [onNodeSelect]
  );

  const handleToggle = useCallback(
    (nodeId: string, expanded: boolean) => {
      onNodeToggle?.(nodeId, expanded);
    },
    [onNodeToggle]
  );

  if (!nodes || nodes.length === 0) {
    return (
      <div className="flex items-center justify-center p-8 text-muted-foreground">
        <p>No files to display</p>
      </div>
    );
  }

  return (
    <div role="tree" aria-label="File tree" className={cn('text-sm select-none', className)}>
      {nodes.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          depth={0}
          selected={node.id === selectedId}
          onSelect={handleSelect}
          onToggle={handleToggle}
          onLoadChildren={onLoadChildren}
          renderNode={renderNode}
          maxDepth={maxDepth}
          searchQuery={searchQuery}
          showErrors={showErrors}
          lazyLoad={lazyLoad}
        />
      ))}
    </div>
  );
};
