/**
 * Streaming file/chunk reader for archives of all sizes.
 * For browser: use File and Web Streams API.
 * For Node: use fs.createReadStream.
 *
 * This module ensures archives of unlimited size can be processed
 * without loading entire files into memory.
 */

/**
 * Stream file chunks from a browser File object.
 * Yields ArrayBuffer chunks for processing.
 *
 * @param file - Browser File object to stream
 * @param chunkSize - Size of each chunk in bytes (default 1MB)
 * @yields ArrayBuffer chunks
 */
export async function* streamFileChunks(
  file: File,
  chunkSize = 1024 * 1024
): AsyncGenerator<ArrayBuffer> {
  let offset = 0;
  while (offset < file.size) {
    const chunk = file.slice(offset, offset + chunkSize);
    yield await chunk.arrayBuffer();
    offset += chunkSize;
  }
}

/**
 * Stream file using Web Streams API (for modern browsers).
 * Provides better backpressure handling for large files.
 *
 * @param file - Browser File object to stream
 * @param chunkSize - Size of each chunk in bytes (default 1MB)
 * @returns ReadableStream of Uint8Array chunks
 */
export function streamFileWithWebStreams(
  file: File,
  chunkSize = 1024 * 1024
): ReadableStream<Uint8Array> {
  let offset = 0;

  return new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (offset >= file.size) {
        controller.close();
        return;
      }

      const chunk = file.slice(offset, offset + chunkSize);
      const arrayBuffer = await chunk.arrayBuffer();
      controller.enqueue(new Uint8Array(arrayBuffer));
      offset += chunkSize;
    },

    cancel() {
      // Cleanup if stream is cancelled
      offset = file.size;
    },
  });
}

/**
 * Progress callback type for streaming operations.
 */
export type ProgressCallback = (bytesRead: number, totalBytes: number, percentage: number) => void;

/**
 * Stream file with progress tracking.
 * Useful for UI feedback during large file operations.
 *
 * @param file - Browser File object to stream
 * @param onProgress - Callback invoked with progress updates
 * @param chunkSize - Size of each chunk in bytes (default 1MB)
 * @yields ArrayBuffer chunks with progress tracking
 */
export async function* streamFileWithProgress(
  file: File,
  onProgress: ProgressCallback,
  chunkSize = 1024 * 1024
): AsyncGenerator<ArrayBuffer> {
  let offset = 0;
  const totalBytes = file.size;

  while (offset < totalBytes) {
    const chunk = file.slice(offset, offset + chunkSize);
    const arrayBuffer = await chunk.arrayBuffer();
    offset += chunkSize;

    const percentage = Math.min(100, (offset / totalBytes) * 100);
    onProgress(offset, totalBytes, percentage);

    yield arrayBuffer;
  }
}

/**
 * Node.js version using fs.createReadStream.
 * This should be used server-side for file streaming.
 *
 * Note: This is a placeholder for Node.js environment.
 * Actual implementation would require 'fs' module.
 */
export interface NodeStreamOptions {
  filePath: string;
  chunkSize?: number;
  encoding?: BufferEncoding;
}

/**
 * Type guard to check if we're in a Node.js environment.
 */
export function isNodeEnvironment(): boolean {
  return (
    typeof process !== 'undefined' && process.versions != null && process.versions.node != null
  );
}

/**
 * Helper to convert ReadableStream to AsyncIterable.
 * Useful for consuming Web Streams with for-await-of loops.
 *
 * @param stream - ReadableStream to convert
 * @returns AsyncIterable of stream chunks
 */
export async function* streamToAsyncIterable<T>(stream: ReadableStream<T>): AsyncGenerator<T> {
  const reader = stream.getReader();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      yield value;
    }
  } finally {
    reader.releaseLock();
  }
}

/**
 * Estimate memory usage for streaming operation.
 * Helps prevent OOM errors by checking available memory.
 *
 * @param fileSize - Size of file to process
 * @param chunkSize - Chunk size for streaming
 * @returns Estimated memory footprint in bytes
 */
export function estimateMemoryUsage(
  fileSize: number,
  chunkSize: number
): {
  peakMemory: number;
  recommendedChunkSize: number;
  safe: boolean;
} {
  // Peak memory is roughly 3x chunk size (read buffer, processing buffer, output buffer)
  const peakMemory = chunkSize * 3;

  // Check if we have performance.memory API (Chrome/Edge)
  interface PerformanceMemory {
    jsHeapSizeLimit?: number;
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
  }

  const perfWithMemory = performance as Performance & { memory?: PerformanceMemory };
  const availableMemory = perfWithMemory.memory?.jsHeapSizeLimit || 2 * 1024 * 1024 * 1024; // Default 2GB

  const safe = peakMemory < availableMemory * 0.1; // Use max 10% of available memory

  // Recommend smaller chunks if unsafe
  const recommendedChunkSize = safe ? chunkSize : Math.floor(availableMemory * 0.03);

  return {
    peakMemory,
    recommendedChunkSize,
    safe,
  };
}
