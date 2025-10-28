/**
 * Archive Handler Registry
 * 
 * Extensible system for registering and managing archive/file handlers.
 * Supports plugin-based architecture for future expandability.
 */

import type {
  ArchiveHandler,
  HandlerRegistry as IHandlerRegistry,
  FileNode,
  ArchiveError,
  RepairResult,
  ValidationResult,
} from '@shared/archive-types';

/**
 * Default handler registry implementation
 */
class HandlerRegistryImpl implements IHandlerRegistry {
  private handlers: Map<string, ArchiveHandler> = new Map();

  register(handler: ArchiveHandler): void {
    if (this.handlers.has(handler.id)) {
      console.warn(`Handler with id "${handler.id}" is already registered. Overwriting.`);
    }
    this.handlers.set(handler.id, handler);
    console.log(`Registered handler: ${handler.name} (${handler.extensions.join(', ')})`);
  }

  unregister(handlerId: string): void {
    const deleted = this.handlers.delete(handlerId);
    if (deleted) {
      console.log(`Unregistered handler: ${handlerId}`);
    } else {
      console.warn(`Handler with id "${handlerId}" not found`);
    }
  }

  getHandlerForExtension(extension: string): ArchiveHandler | undefined {
    const normalizedExt = extension.toLowerCase().replace(/^\./, '');
    const handlers = Array.from(this.handlers.values());
    for (const handler of handlers) {
      if (handler.extensions.some((ext: string) => ext.toLowerCase() === normalizedExt)) {
        return handler;
      }
    }
    return undefined;
  }

  getHandlerForMimeType(mimeType: string): ArchiveHandler | undefined {
    const normalizedMime = mimeType.toLowerCase();
    const handlers = Array.from(this.handlers.values());
    for (const handler of handlers) {
      if (handler.mimeTypes?.some((mime: string) => mime.toLowerCase() === normalizedMime)) {
        return handler;
      }
    }
    return undefined;
  }

  getAllHandlers(): ArchiveHandler[] {
    return Array.from(this.handlers.values());
  }

  clear(): void {
    this.handlers.clear();
  }
}

/**
 * Global handler registry instance
 */
export const handlerRegistry = new HandlerRegistryImpl();

/**
 * Built-in ZIP handler using JSZip
 */
export const createZipHandler = (): ArchiveHandler => {
  return {
    id: 'zip-handler',
    name: 'ZIP Archive Handler',
    extensions: ['zip'],
    mimeTypes: ['application/zip', 'application/x-zip-compressed'],
    canRepair: true,

    async load(data: ArrayBuffer | Blob): Promise<FileNode[]> {
      try {
        // Note: Using dynamic import for JSZip
        // This allows the library to be code-split and only loaded when needed
        // Reduces initial bundle size when ZIP functionality isn't immediately used
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        await zip.loadAsync(data);

        const nodes: FileNode[] = [];
        const folderMap = new Map<string, FileNode>();
        
        // First pass: collect all entries with their metadata
        const entries: Array<{ path: string; entry: any }> = [];
        zip.forEach((relativePath, zipEntry) => {
          entries.push({ path: relativePath, entry: zipEntry });
        });

        // Process entries to build tree structure
        for (const { path: relativePath, entry: zipEntry } of entries) {
          const parts = relativePath.split('/').filter(Boolean);
          const name = parts[parts.length - 1];
          const isDir = zipEntry.dir;

          // Create all parent folders
          let currentPath = '';
          for (let i = 0; i < parts.length - 1; i++) {
            const folderName = parts[i];
            const folderPath = currentPath ? `${currentPath}/${folderName}` : folderName;

            if (!folderMap.has(folderPath)) {
              const folderNode: FileNode = {
                id: folderPath,
                name: folderName,
                type: 'folder',
                path: folderPath,
                children: [],
              };
              folderMap.set(folderPath, folderNode);

              // Add to parent or root
              if (currentPath) {
                const parent = folderMap.get(currentPath);
                if (parent && parent.children) {
                  parent.children.push(folderNode);
                }
              } else {
                nodes.push(folderNode);
              }
            }

            currentPath = folderPath;
          }

          // Add file or folder node
          if (name) {
            // For files, attempt to get size from metadata
            // JSZip stores metadata in internal properties, but we can get size
            // by checking the entry's internal state or reading the data
            let fileSize: number | undefined;
            if (!isDir) {
              // Try to get size from the entry's metadata if available
              // This is safer than accessing private properties
              try {
                // JSZip's public API doesn't expose uncompressed size directly
                // but we can infer it's available in the object
                const entryData = (zipEntry as any)._data;
                if (entryData && typeof entryData.uncompressedSize === 'number') {
                  fileSize = entryData.uncompressedSize;
                }
              } catch {
                // If metadata access fails, leave size undefined
                fileSize = undefined;
              }
            }
            
            const node: FileNode = {
              id: relativePath,
              name,
              type: isDir ? 'folder' : 'file',
              path: relativePath,
              size: fileSize,
              children: isDir ? [] : undefined,
            };

            if (isDir) {
              folderMap.set(relativePath, node);
            }

            // Add to parent or root
            const parentPath = parts.slice(0, -1).join('/');
            if (parentPath) {
              const parent = folderMap.get(parentPath);
              if (parent && parent.children) {
                parent.children.push(node);
              }
            } else {
              nodes.push(node);
            }
          }
        }

        return nodes;
      } catch (error) {
        throw new Error(`Failed to load ZIP archive: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    },

    async extract(node: FileNode): Promise<Blob> {
      // This would need the original zip data to be passed somehow
      // For now, throw not implemented
      throw new Error('Extract not implemented for ZIP handler');
    },

    async repair(data: ArrayBuffer | Blob, error: ArchiveError): Promise<RepairResult> {
      const log: string[] = [];
      log.push('Attempting ZIP repair...');

      try {
        // Try to load with lenient mode
        const JSZip = (await import('jszip')).default;
        const zip = new JSZip();
        
        // JSZip doesn't have a true "repair" mode, but we can try loading with optimistic parsing
        await zip.loadAsync(data, { 
          checkCRC32: false, // Skip CRC checks
        });

        log.push('Successfully loaded archive with relaxed validation');

        // Extract file tree
        const fileTree: FileNode[] = [];
        const unrepairedSections: { path: string; reason: string }[] = [];

        zip.forEach((relativePath, zipEntry) => {
          try {
            // Try to get size from metadata safely
            let fileSize: number | undefined;
            if (!zipEntry.dir) {
              try {
                const entryData = (zipEntry as any)._data;
                if (entryData && typeof entryData.uncompressedSize === 'number') {
                  fileSize = entryData.uncompressedSize;
                }
              } catch {
                fileSize = undefined;
              }
            }
            
            const node: FileNode = {
              id: relativePath,
              name: relativePath.split('/').pop() || relativePath,
              type: zipEntry.dir ? 'folder' : 'file',
              path: relativePath,
              size: fileSize,
            };
            fileTree.push(node);
            log.push(`Recovered: ${relativePath}`);
          } catch (entryError) {
            unrepairedSections.push({
              path: relativePath,
              reason: entryError instanceof Error ? entryError.message : 'Unknown error',
            });
            log.push(`Failed to recover: ${relativePath}`);
          }
        });

        return {
          success: fileTree.length > 0,
          fileTree,
          unrepairedSections,
          log,
        };
      } catch (repairError) {
        log.push(`Repair failed: ${repairError instanceof Error ? repairError.message : 'Unknown error'}`);
        return {
          success: false,
          log,
        };
      }
    },

    async validate(node: FileNode): Promise<ValidationResult> {
      // Basic validation
      const issues: ValidationResult['issues'] = [];

      if (!node.name) {
        issues.push({
          severity: 'error',
          message: 'File name is missing',
        });
      }

      if (node.type === 'file' && node.size === undefined) {
        issues.push({
          severity: 'warning',
          message: 'File size is unknown',
        });
      }

      return {
        valid: issues.filter(i => i.severity === 'error').length === 0,
        issues: issues.length > 0 ? issues : undefined,
      };
    },
  };
};

/**
 * Register default handlers
 */
export const registerDefaultHandlers = (): void => {
  handlerRegistry.register(createZipHandler());
  // Additional handlers can be registered here
};

// Auto-register default handlers
registerDefaultHandlers();
