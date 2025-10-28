/**
 * Virtualized list for massive file trees.
 * Accepts a flat array of (possibly-nested) file nodes.
 * Uses simple virtualization for efficient rendering of huge lists.
 */

import React, { useRef, useEffect, useState } from "react";
import { FileNode } from "@/lib/archiveHandlers";
import { File, Folder, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

export interface HugeFileTreeProps {
  files: FileNode[];
  onFileClick?: (file: FileNode) => void;
  height?: number;
  width?: number | string;
  itemSize?: number;
  className?: string;
}

/**
 * Virtualized file tree component for displaying massive file lists.
 * Only renders visible items for optimal performance.
 */
export const HugeFileTree: React.FC<HugeFileTreeProps> = ({
  files,
  onFileClick,
  height = 600,
  width = "100%",
  itemSize = 32,
  className
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });

  // Calculate visible range based on scroll position
  const handleScroll = () => {
    if (!scrollRef.current) return;
    
    const scrollTop = scrollRef.current.scrollTop;
    const visibleCount = Math.ceil(height / itemSize);
    const start = Math.floor(scrollTop / itemSize);
    const end = start + visibleCount + 10; // Add buffer
    
    setVisibleRange({ start: Math.max(0, start - 10), end: Math.min(files.length, end) });
  };

  useEffect(() => {
    const scrollElement = scrollRef.current;
    if (scrollElement) {
      scrollElement.addEventListener('scroll', handleScroll);
      return () => scrollElement.removeEventListener('scroll', handleScroll);
    }
  }, []);

  const FileRow: React.FC<{ file: FileNode; index: number }> = ({ file, index }) => {
    const handleClick = () => {
      if (onFileClick) {
        onFileClick(file);
      }
    };

    const hasError = Boolean(file.error);
    const isDir = file.isDirectory;

    return (
      <div
        style={{
          position: 'absolute',
          top: index * itemSize,
          left: 0,
          right: 0,
          height: itemSize
        }}
        className={cn(
          "flex items-center gap-2 px-2 cursor-pointer hover:bg-accent transition-colors",
          hasError && "bg-red-50 dark:bg-red-900/20",
          className
        )}
        onClick={handleClick}
        title={file.error || file.path}
      >
        {/* Icon */}
        {hasError ? (
          <AlertTriangle className="h-4 w-4 text-red-500 flex-shrink-0" />
        ) : isDir ? (
          <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
        ) : (
          <File className="h-4 w-4 text-gray-500 flex-shrink-0" />
        )}

        {/* File name */}
        <span
          className={cn(
            "flex-1 truncate text-sm",
            hasError && "text-red-600 dark:text-red-400"
          )}
        >
          {file.name}
        </span>

        {/* File size */}
        {!isDir && (
          <span className="text-xs text-muted-foreground flex-shrink-0">
            {formatFileSize(file.size)}
          </span>
        )}

        {/* Error indicator */}
        {hasError && (
          <span className="text-xs text-red-600 dark:text-red-400 flex-shrink-0">
            ⚠️
          </span>
        )}
      </div>
    );
  };

  const visibleFiles = files.slice(visibleRange.start, visibleRange.end);

  return (
    <div className={cn("border rounded-md", className)} style={{ width, height }}>
      <div 
        ref={scrollRef}
        style={{ 
          height: '100%',
          overflow: 'auto',
          position: 'relative'
        }}
      >
        <div style={{ height: files.length * itemSize, position: 'relative' }}>
          {visibleFiles.map((file, i) => (
            <FileRow 
              key={visibleRange.start + i} 
              file={file} 
              index={visibleRange.start + i} 
            />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Format file size in human-readable format.
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default HugeFileTree;
