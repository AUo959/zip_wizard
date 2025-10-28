/**
 * Registry for all archive formats (zip, tar, rar, etc.).
 * Each handler processes streaming chunks and emits indexed files.
 * 
 * This plugin-based architecture allows infinite extensibility
 * and format support without modifying core logic.
 */

/**
 * Represents a file node in an archive.
 */
export interface FileNode {
  name: string;
  path: string;
  size: number;
  compressedSize?: number;
  isDirectory: boolean;
  modified?: Date;
  created?: Date;
  crc?: number;
  error?: string;
  metadata?: Record<string, any>;
  children?: FileNode[];
}

/**
 * Progress information for parsing operations.
 */
export interface ParseProgress {
  bytesProcessed: number;
  totalBytes: number;
  filesIndexed: number;
  currentFile?: string;
  percentage: number;
}

/**
 * Options for archive parsing.
 */
export interface ParseOptions {
  onProgress?: (progress: ParseProgress) => void;
  onFileDiscovered?: (file: FileNode) => void;
  maxDepth?: number; // For nested archives
  includeMetadata?: boolean;
  recoverCorrupted?: boolean;
}

/**
 * Handler function type for processing archive streams.
 * Takes an async iterable of ArrayBuffer chunks and returns file nodes.
 */
export type Handler = (
  stream: AsyncIterable<ArrayBuffer>,
  options?: ParseOptions
) => Promise<FileNode[]>;

/**
 * Archive format handler registry.
 */
class ArchiveHandlerRegistry {
  private handlers: Map<string, Handler> = new Map();

  /**
   * Register a handler for a specific archive format.
   * 
   * @param format - Format identifier (e.g., 'zip', 'tar', 'rar')
   * @param handler - Handler function to process the format
   */
  registerHandler(format: string, handler: Handler): void {
    this.handlers.set(format.toLowerCase(), handler);
  }

  /**
   * Get a handler for a specific format.
   * 
   * @param format - Format identifier
   * @returns Handler function or undefined if not found
   */
  getHandler(format: string): Handler | undefined {
    return this.handlers.get(format.toLowerCase());
  }

  /**
   * Check if a handler exists for a format.
   * 
   * @param format - Format identifier
   * @returns True if handler exists
   */
  hasHandler(format: string): boolean {
    return this.handlers.has(format.toLowerCase());
  }

  /**
   * Get all registered format names.
   * 
   * @returns Array of format identifiers
   */
  getSupportedFormats(): string[] {
    return Array.from(this.handlers.keys());
  }

  /**
   * Detect format from file extension or magic bytes.
   * 
   * @param filename - Name of the file
   * @param firstChunk - Optional first chunk for magic byte detection
   * @returns Detected format or undefined
   */
  detectFormat(filename: string, firstChunk?: ArrayBuffer): string | undefined {
    // Try extension first
    const ext = filename.split('.').pop()?.toLowerCase();
    if (ext && this.hasHandler(ext)) {
      return ext;
    }

    // Try magic bytes if available
    if (firstChunk && firstChunk.byteLength >= 4) {
      const view = new DataView(firstChunk);
      const magic = view.getUint32(0, false);

      // ZIP magic: 0x504B0304 or 0x504B0506
      if (magic === 0x504B0304 || magic === 0x504B0506) {
        return 'zip';
      }

      // RAR magic: 0x52617221 ("Rar!")
      if (magic === 0x52617221) {
        return 'rar';
      }

      // 7z magic: 0x377ABCAF27
      const magic7z = view.getUint32(0, true);
      if (magic7z === 0x7A37AFBC) {
        return '7z';
      }

      // TAR (check for ustar signature at offset 257)
      if (firstChunk.byteLength >= 262) {
        const tarView = new Uint8Array(firstChunk, 257, 5);
        const ustar = String.fromCharCode(tarView[0], tarView[1], tarView[2], tarView[3], tarView[4]);
        if (ustar === 'ustar') {
          return 'tar';
        }
      }

      // GZIP magic: 0x1F8B
      if ((magic >> 16) === 0x1F8B) {
        return 'gz';
      }
    }

    return undefined;
  }
}

// Global registry instance
const registry = new ArchiveHandlerRegistry();

/**
 * Register a handler for a specific archive format.
 * 
 * @param format - Format identifier (e.g., 'zip', 'tar', 'rar')
 * @param handler - Handler function to process the format
 */
export function registerHandler(format: string, handler: Handler): void {
  registry.registerHandler(format, handler);
}

/**
 * Parse an archive using the appropriate handler.
 * 
 * @param format - Format identifier or filename for auto-detection
 * @param stream - Async iterable of ArrayBuffer chunks
 * @param options - Parsing options
 * @returns Array of file nodes
 * @throws Error if no handler found for format
 */
export async function parseWithHandler(
  format: string,
  stream: AsyncIterable<ArrayBuffer>,
  options?: ParseOptions
): Promise<FileNode[]> {
  // Try to detect format if it looks like a filename
  if (format.includes('.')) {
    const detected = registry.detectFormat(format);
    if (detected) {
      format = detected;
    }
  }

  const handler = registry.getHandler(format);
  if (!handler) {
    throw new Error(`No handler registered for format: ${format}`);
  }

  return await handler(stream, options);
}

/**
 * Get all supported archive formats.
 * 
 * @returns Array of format identifiers
 */
export function getSupportedFormats(): string[] {
  return registry.getSupportedFormats();
}

/**
 * Detect archive format from filename or magic bytes.
 * 
 * @param filename - Name of the file
 * @param firstChunk - Optional first chunk for magic byte detection
 * @returns Detected format or undefined
 */
export function detectArchiveFormat(filename: string, firstChunk?: ArrayBuffer): string | undefined {
  return registry.detectFormat(filename, firstChunk);
}

/**
 * Check if a format is supported.
 * 
 * @param format - Format identifier
 * @returns True if format is supported
 */
export function isFormatSupported(format: string): boolean {
  return registry.hasHandler(format);
}

// Export the registry for advanced use cases
export { registry as archiveHandlerRegistry };
