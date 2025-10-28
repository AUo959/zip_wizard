/**
 * Advanced Archive Manager Type Definitions
 *
 * Comprehensive type system for the enhanced archive management system.
 * Supports infinite nesting, error recovery, repair operations, and extensibility.
 */

/**
 * Status of an archive or file operation
 */
export type ArchiveStatus =
  | 'idle' // No operation in progress
  | 'loading' // Loading archive
  | 'processing' // Processing files
  | 'analyzing' // Running analysis
  | 'repairing' // Attempting repair
  | 'completed' // Operation completed successfully
  | 'error' // Error occurred
  | 'corrupted' // Archive is corrupted
  | 'partial'; // Partially recovered

/**
 * Types of actions that can be performed on an archive
 */
export type ArchiveAction =
  | 'open' // Open/load archive
  | 'export' // Export archive or files
  | 'delete' // Delete archive
  | 'tag' // Add/edit tags
  | 'compare' // Compare with another archive
  | 'scan' // Scan for issues/vulnerabilities
  | 'repair' // Attempt to repair corrupted archive
  | 'analyze' // Deep analysis
  | 'optimize' // Optimize archive structure
  | 'extract'; // Extract files

/**
 * Type of file node in the tree
 */
export type FileNodeType = 'file' | 'folder' | 'archive';

/**
 * Severity level for errors and warnings
 */
export type ErrorSeverity = 'info' | 'warning' | 'error' | 'critical';

/**
 * Error details with recovery information
 */
export interface ArchiveError {
  /** Error message */
  message: string;
  /** Error code for programmatic handling */
  code?: string;
  /** Severity level */
  severity: ErrorSeverity;
  /** Whether recovery is possible */
  recoverable: boolean;
  /** Stack trace or additional debug info */
  details?: string;
  /** Suggested recovery actions */
  recoveryActions?: RecoveryAction[];
  /** Timestamp when error occurred */
  timestamp: Date;
}

/**
 * Recovery action that can be performed
 */
export interface RecoveryAction {
  /** Action identifier */
  id: string;
  /** Display label */
  label: string;
  /** Description of what this action does */
  description: string;
  /** Handler function */
  handler: () => void | Promise<void>;
  /** Icon identifier (Lucide icon name) */
  icon?: string;
}

/**
 * File node in the archive tree
 * Supports infinite nesting of folders and archives
 */
export interface FileNode {
  /** Unique identifier */
  id: string;
  /** File/folder name */
  name: string;
  /** Node type */
  type: FileNodeType;
  /** File size in bytes (if applicable) */
  size?: number;
  /** MIME type */
  mimeType?: string;
  /** File extension */
  extension?: string;
  /** Path within archive */
  path: string;
  /** Child nodes (for folders and nested archives) */
  children?: FileNode[];
  /** Error information if node is corrupted/unreadable */
  error?: ArchiveError;
  /** Whether this node has been partially recovered */
  partiallyRecovered?: boolean;
  /** Metadata about the file */
  metadata?: {
    /** Last modified date */
    lastModified?: Date;
    /** Compression ratio */
    compressionRatio?: number;
    /** Whether file is encrypted */
    encrypted?: boolean;
    /** Custom metadata */
    [key: string]: any;
  };
  /** Whether this node is currently loading */
  loading?: boolean;
  /** Whether this node is expanded (for UI state) */
  expanded?: boolean;
}

/**
 * Archive definition with comprehensive metadata
 */
export interface Archive {
  /** Unique identifier */
  id: string;
  /** Archive name */
  name: string;
  /** File size in bytes */
  size: number;
  /** Current status */
  status: ArchiveStatus;
  /** Error information if applicable */
  error?: ArchiveError;
  /** Root file tree */
  fileTree?: FileNode[];
  /** Archive format (zip, tar, 7z, etc.) */
  format?: string;
  /** Creation date */
  createdAt: Date;
  /** Last modified date */
  modifiedAt?: Date;
  /** Tags for organization */
  tags?: string[];
  /** Health score (0-100) */
  healthScore?: number;
  /** Number of files in archive */
  fileCount?: number;
  /** Number of corrupted files */
  corruptedFileCount?: number;
  /** Compression ratio */
  compressionRatio?: number;
  /** Whether archive is encrypted */
  encrypted?: boolean;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Processing progress (0-100) */
  progress?: number;
}

/**
 * Handler for archive/file operations
 */
export interface ArchiveHandler {
  /** Handler identifier */
  id: string;
  /** Human-readable name */
  name: string;
  /** File extensions this handler supports */
  extensions: string[];
  /** MIME types this handler supports */
  mimeTypes?: string[];
  /** Whether this handler can repair corrupted files */
  canRepair: boolean;
  /** Load archive or file */
  load: (data: ArrayBuffer | Blob) => Promise<FileNode[]>;
  /** Extract specific file */
  extract?: (node: FileNode) => Promise<Blob>;
  /** Attempt to repair corrupted data */
  repair?: (data: ArrayBuffer | Blob, error: ArchiveError) => Promise<RepairResult>;
  /** Validate file integrity */
  validate?: (node: FileNode) => Promise<ValidationResult>;
}

/**
 * Result of a repair operation
 */
export interface RepairResult {
  /** Whether repair was successful */
  success: boolean;
  /** Repaired file tree */
  fileTree?: FileNode[];
  /** Sections that could not be repaired */
  unrepairedSections?: {
    path: string;
    reason: string;
  }[];
  /** Repair log */
  log: string[];
  /** Original data (for comparison) */
  originalData?: ArrayBuffer | Blob;
}

/**
 * Result of a validation operation
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Issues found */
  issues?: {
    severity: ErrorSeverity;
    message: string;
    location?: string;
  }[];
  /** Suggestions for fixing issues */
  suggestions?: string[];
}

/**
 * Code repair strategy for corrupted text/code files
 */
export interface CodeRepairStrategy {
  /** Strategy identifier */
  id: string;
  /** Strategy name */
  name: string;
  /** Description */
  description: string;
  /** Apply repair strategy */
  repair: (content: string, language?: string) => Promise<CodeRepairResult>;
}

/**
 * Result of code repair operation
 */
export interface CodeRepairResult {
  /** Successfully repaired content */
  repairedContent: string;
  /** Sections that were repaired */
  repairedSections: {
    line: number;
    original: string;
    repaired: string;
    reason: string;
  }[];
  /** Confidence score (0-1) */
  confidence: number;
  /** Whether repair was complete or partial */
  complete: boolean;
}

/**
 * Registry for archive handlers
 */
export interface HandlerRegistry {
  /** Register a new handler */
  register: (handler: ArchiveHandler) => void;
  /** Unregister a handler */
  unregister: (handlerId: string) => void;
  /** Get handler for file extension */
  getHandlerForExtension: (extension: string) => ArchiveHandler | undefined;
  /** Get handler for MIME type */
  getHandlerForMimeType: (mimeType: string) => ArchiveHandler | undefined;
  /** Get all registered handlers */
  getAllHandlers: () => ArchiveHandler[];
}

/**
 * Props for ArchiveManager component
 */
export interface ArchiveManagerProps {
  /** List of archives to manage */
  archives: Archive[];
  /** Callback when archive action is performed */
  onArchiveAction: (archiveId: string, action: ArchiveAction, params?: any) => void | Promise<void>;
  /** ID of currently selected archive */
  selectedArchiveId?: string;
  /** Whether component is in loading state */
  loading?: boolean;
  /** Search query for filtering */
  searchQuery?: string;
  /** Custom render function for file tree */
  renderFileTree?: (archive: Archive, fileTree: FileNode[]) => React.ReactNode;
  /** Custom render function for archive details */
  renderArchiveDetails?: (archive: Archive) => React.ReactNode;
  /** Custom render function for error state */
  renderError?: (error: ArchiveError, archive: Archive) => React.ReactNode;
  /** Handler registry */
  handlerRegistry?: HandlerRegistry;
  /** Whether to enable repair functionality */
  enableRepair?: boolean;
  /** Whether to enable comparison */
  enableComparison?: boolean;
  /** Custom CSS class */
  className?: string;
}

/**
 * Props for FileTree component
 */
export interface FileTreeProps {
  /** Root nodes to display */
  nodes: FileNode[];
  /** Callback when node is selected */
  onNodeSelect?: (node: FileNode) => void;
  /** Callback when node is expanded/collapsed */
  onNodeToggle?: (nodeId: string, expanded: boolean) => void;
  /** Currently selected node ID */
  selectedNodeId?: string;
  /** Whether to show error indicators */
  showErrors?: boolean;
  /** Whether to enable lazy loading */
  lazyLoad?: boolean;
  /** Callback to load children for a node */
  onLoadChildren?: (node: FileNode) => Promise<FileNode[]>;
  /** Custom node renderer */
  renderNode?: (node: FileNode, depth: number) => React.ReactNode;
  /** Maximum depth to render (-1 for infinite) */
  maxDepth?: number;
  /** Search query for highlighting */
  searchQuery?: string;
  /** Custom CSS class */
  className?: string;
}
