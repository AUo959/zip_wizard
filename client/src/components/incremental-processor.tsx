import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  Loader2, 
  FileArchive, 
  CheckCircle, 
  AlertCircle,
  PlayCircle,
  PauseCircle,
  RotateCw,
  Zap
} from 'lucide-react';

interface IncrementalProcessorProps {
  file?: File;
  onProcessComplete?: (result: ProcessingResult) => void;
  onChunkProcessed?: (chunk: ChunkData) => void;
}

interface ProcessingResult {
  totalFiles: number;
  processedFiles: number;
  totalSize: number;
  processedSize: number;
  chunks: ChunkData[];
  errors: string[];
  duration: number;
}

interface ChunkData {
  id: string;
  index: number;
  files: number;
  size: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  startTime?: number;
  endTime?: number;
}

export function IncrementalProcessor({ file, onProcessComplete, onChunkProcessed }: IncrementalProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [chunks, setChunks] = useState<ChunkData[]>([]);
  const [currentChunk, setCurrentChunk] = useState<number>(0);
  const [overallProgress, setOverallProgress] = useState(0);
  const [processingResult, setProcessingResult] = useState<ProcessingResult | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [startTime, setStartTime] = useState<number>(0);

  // Chunk size configuration (in bytes)
  const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks
  const MAX_CONCURRENT_CHUNKS = 3;

  const initializeChunks = useCallback(() => {
    if (!file) return;

    const fileSize = file.size;
    const numChunks = Math.ceil(fileSize / CHUNK_SIZE);
    
    const newChunks: ChunkData[] = [];
    for (let i = 0; i < numChunks; i++) {
      newChunks.push({
        id: `chunk-${i}`,
        index: i,
        files: 0, // Will be updated during processing
        size: Math.min(CHUNK_SIZE, fileSize - i * CHUNK_SIZE),
        status: 'pending',
        progress: 0
      });
    }
    
    setChunks(newChunks);
    return newChunks;
  }, [file, CHUNK_SIZE]);

  const processChunk = async (chunk: ChunkData): Promise<ChunkData> => {
    // Update chunk status to processing
    setChunks(prev => prev.map(c => 
      c.id === chunk.id ? { ...c, status: 'processing', startTime: Date.now() } : c
    ));

    // Simulate chunk processing with progress updates
    for (let progress = 0; progress <= 100; progress += 10) {
      if (isPaused) {
        await new Promise(resolve => {
          const checkPause = setInterval(() => {
            if (!isPaused) {
              clearInterval(checkPause);
              resolve(undefined);
            }
          }, 100);
        });
      }

      await new Promise(resolve => setTimeout(resolve, 100));
      
      setChunks(prev => prev.map(c => 
        c.id === chunk.id ? { ...c, progress } : c
      ));
    }

    // Complete chunk processing
    const completedChunk: ChunkData = {
      ...chunk,
      status: 'completed',
      progress: 100,
      endTime: Date.now(),
      files: Math.floor(Math.random() * 50) + 10 // Mock file count
    };

    setChunks(prev => prev.map(c => 
      c.id === chunk.id ? completedChunk : c
    ));

    onChunkProcessed?.(completedChunk);
    return completedChunk;
  };

  const startProcessing = async () => {
    if (!file) return;

    setIsProcessing(true);
    setIsPaused(false);
    setErrors([]);
    setStartTime(Date.now());
    
    const chunksToProcess = initializeChunks() || [];
    
    try {
      // Process chunks with concurrency limit
      const processedChunks: ChunkData[] = [];
      
      for (let i = 0; i < chunksToProcess.length; i += MAX_CONCURRENT_CHUNKS) {
        const batch = chunksToProcess.slice(i, i + MAX_CONCURRENT_CHUNKS);
        setCurrentChunk(i);
        
        const batchResults = await Promise.all(
          batch.map(chunk => processChunk(chunk))
        );
        
        processedChunks.push(...batchResults);
        
        // Update overall progress
        const progress = ((i + batch.length) / chunksToProcess.length) * 100;
        setOverallProgress(progress);
      }

      // Calculate final results
      const result: ProcessingResult = {
        totalFiles: processedChunks.reduce((sum, c) => sum + c.files, 0),
        processedFiles: processedChunks.reduce((sum, c) => sum + c.files, 0),
        totalSize: file.size,
        processedSize: file.size,
        chunks: processedChunks,
        errors: errors,
        duration: Date.now() - startTime
      };

      setProcessingResult(result);
      onProcessComplete?.(result);
    } catch (error) {
      setErrors(prev => [...prev, `Processing error: ${error}`]);
    } finally {
      setIsProcessing(false);
      setOverallProgress(100);
    }
  };

  const pauseProcessing = () => {
    setIsPaused(!isPaused);
  };

  const resetProcessor = () => {
    setIsProcessing(false);
    setIsPaused(false);
    setChunks([]);
    setCurrentChunk(0);
    setOverallProgress(0);
    setProcessingResult(null);
    setErrors([]);
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileArchive className="w-5 h-5 text-blue-600" />
            Incremental Archive Processor
            <Badge variant="outline" className="ml-auto">
              High Performance
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Info */}
          {file && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium">{file.name}</span>
                </div>
                <Badge variant="secondary">{formatBytes(file.size)}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {chunks.length > 0 && `${chunks.length} chunks × ${formatBytes(CHUNK_SIZE)}`}
              </div>
            </div>
          )}

          {/* Control Buttons */}
          <div className="flex gap-2">
            {!isProcessing && !processingResult && (
              <Button 
                onClick={startProcessing}
                disabled={!file}
                className="flex items-center gap-2"
              >
                <PlayCircle className="w-4 h-4" />
                Start Processing
              </Button>
            )}
            
            {isProcessing && (
              <Button 
                onClick={pauseProcessing}
                variant="outline"
                className="flex items-center gap-2"
              >
                {isPaused ? (
                  <>
                    <PlayCircle className="w-4 h-4" />
                    Resume
                  </>
                ) : (
                  <>
                    <PauseCircle className="w-4 h-4" />
                    Pause
                  </>
                )}
              </Button>
            )}
            
            {processingResult && (
              <Button 
                onClick={resetProcessor}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RotateCw className="w-4 h-4" />
                Reset
              </Button>
            )}
          </div>

          {/* Overall Progress */}
          {isProcessing && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Overall Progress</span>
                <span className="text-sm text-muted-foreground">
                  {Math.round(overallProgress)}%
                </span>
              </div>
              <Progress value={overallProgress} className="h-3" />
              
              {isPaused && (
                <Alert>
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    Processing paused. Click Resume to continue.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Chunk Status Grid */}
          {chunks.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Chunk Processing Status</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {chunks.map((chunk) => (
                  <div 
                    key={chunk.id}
                    className={`p-3 rounded-lg border ${
                      chunk.status === 'completed' ? 'bg-green-50 border-green-200' :
                      chunk.status === 'processing' ? 'bg-blue-50 border-blue-200' :
                      chunk.status === 'error' ? 'bg-red-50 border-red-200' :
                      'bg-muted/30 border-border'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium">Chunk {chunk.index + 1}</span>
                      {chunk.status === 'completed' && (
                        <CheckCircle className="w-3 h-3 text-green-600" />
                      )}
                      {chunk.status === 'processing' && (
                        <Loader2 className="w-3 h-3 text-blue-600 animate-spin" />
                      )}
                    </div>
                    <Progress value={chunk.progress} className="h-1" />
                    <div className="mt-1 text-xs text-muted-foreground">
                      {formatBytes(chunk.size)}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Processing Results */}
          {processingResult && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="w-5 h-5" />
                <span className="font-medium">Processing Complete</span>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold">{processingResult.totalFiles}</div>
                  <div className="text-xs text-muted-foreground">Total Files</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold">{formatBytes(processingResult.processedSize)}</div>
                  <div className="text-xs text-muted-foreground">Processed</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold">{processingResult.chunks.length}</div>
                  <div className="text-xs text-muted-foreground">Chunks</div>
                </div>
                <div className="text-center p-3 bg-muted/30 rounded-lg">
                  <div className="text-lg font-bold">{formatDuration(processingResult.duration)}</div>
                  <div className="text-xs text-muted-foreground">Duration</div>
                </div>
              </div>

              {processingResult.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="w-4 h-4" />
                  <AlertDescription>
                    {processingResult.errors.length} error(s) occurred during processing
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Performance Tips */}
          <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-800">Performance Tips</span>
            </div>
            <ul className="space-y-1 text-xs text-blue-700">
              <li>• Large archives are processed in chunks to prevent memory issues</li>
              <li>• Processing can be paused and resumed without losing progress</li>
              <li>• Multiple chunks are processed concurrently for better performance</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}