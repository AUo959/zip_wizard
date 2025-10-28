import { useState, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Clock,
  Zap,
  Activity,
  Timer,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Pause,
  Play,
  RotateCw,
  Settings,
  Gauge,
  Brain,
} from 'lucide-react';

interface TimingOptimizerProps {
  onOptimizationApplied?: (config: OptimizationConfig) => void;
  onTimeoutPrevented?: (operation: string) => void;
}

interface OptimizationConfig {
  maxConcurrent: number;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  batchSize: number;
  throttleMs: number;
  adaptiveScaling: boolean;
  priorityQueuing: boolean;
  circuitBreakerEnabled: boolean;
  resourcePooling: boolean;
}

interface OperationMetrics {
  name: string;
  averageTime: number;
  successRate: number;
  timeouts: number;
  retries: number;
  lastRun: Date;
  status: 'success' | 'failed' | 'timeout' | 'pending';
}

interface QueueItem {
  id: string;
  operation: () => Promise<any>;
  priority: number;
  timeout: number;
  retries: number;
  createdAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  status: 'queued' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}

interface ResourcePool {
  id: string;
  type: string;
  available: number;
  total: number;
  inUse: number;
  waitQueue: number;
}

interface CircuitBreaker {
  state: 'closed' | 'open' | 'half-open';
  failures: number;
  successCount: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
}

export function TimingOptimizer({
  onOptimizationApplied,
  onTimeoutPrevented,
}: TimingOptimizerProps) {
  const [config, setConfig] = useState<OptimizationConfig>({
    maxConcurrent: 5,
    timeout: 30000,
    retryAttempts: 3,
    retryDelay: 1000,
    batchSize: 10,
    throttleMs: 100,
    adaptiveScaling: true,
    priorityQueuing: true,
    circuitBreakerEnabled: true,
    resourcePooling: true,
  });

  const [isOptimizing, setIsOptimizing] = useState(false);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeOperations, setActiveOperations] = useState<QueueItem[]>([]);
  const [completedOperations, setCompletedOperations] = useState<QueueItem[]>([]);
  const [metrics, setMetrics] = useState<OperationMetrics[]>([]);
  const [resourcePools, setResourcePools] = useState<ResourcePool[]>([]);
  const [circuitBreakers, setCircuitBreakers] = useState<Map<string, CircuitBreaker>>(new Map());
  const [systemLoad, setSystemLoad] = useState(0);
  const [throughput, setThroughput] = useState(0);

  const _queueRef = useRef<QueueItem[]>([]);
  const runningRef = useRef<number>(0);
  const metricsRef = useRef<Map<string, OperationMetrics>>(new Map());

  // Adaptive scaling based on system performance
  const adaptiveScale = useCallback(() => {
    if (!config.adaptiveScaling) return;

    const avgResponseTime =
      metrics.reduce((sum, m) => sum + m.averageTime, 0) / Math.max(metrics.length, 1);
    const successRate =
      metrics.reduce((sum, m) => sum + m.successRate, 0) / Math.max(metrics.length, 1);

    let newConfig = { ...config };

    // Adjust concurrency based on performance
    if (successRate > 0.95 && avgResponseTime < 1000) {
      newConfig.maxConcurrent = Math.min(config.maxConcurrent + 1, 20);
    } else if (successRate < 0.8 || avgResponseTime > 5000) {
      newConfig.maxConcurrent = Math.max(config.maxConcurrent - 1, 1);
    }

    // Adjust timeout based on average response times
    if (avgResponseTime > config.timeout * 0.8) {
      newConfig.timeout = Math.min(config.timeout * 1.5, 60000);
    }

    // Adjust batch size based on throughput
    if (throughput > 100) {
      newConfig.batchSize = Math.min(config.batchSize + 2, 50);
    } else if (throughput < 10) {
      newConfig.batchSize = Math.max(config.batchSize - 2, 1);
    }

    if (JSON.stringify(newConfig) !== JSON.stringify(config)) {
      setConfig(newConfig);
      onOptimizationApplied?.(newConfig);
    }
  }, [config, metrics, throughput, onOptimizationApplied]);

  // Exponential backoff retry logic
  const calculateRetryDelay = (attempt: number): number => {
    const baseDelay = config.retryDelay;
    const maxDelay = 30000;
    const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  };

  // Circuit breaker implementation
  const checkCircuitBreaker = (operationName: string): boolean => {
    const breaker = circuitBreakers.get(operationName);
    if (!breaker || !config.circuitBreakerEnabled) return true;

    if (breaker.state === 'open') {
      if (breaker.nextRetryTime && new Date() > breaker.nextRetryTime) {
        // Try half-open state
        setCircuitBreakers(prev => {
          const updated = new Map(prev);
          updated.set(operationName, { ...breaker, state: 'half-open' });
          return updated;
        });
        return true;
      }
      return false;
    }

    return true;
  };

  const updateCircuitBreaker = (operationName: string, success: boolean) => {
    if (!config.circuitBreakerEnabled) return;

    setCircuitBreakers(prev => {
      const updated = new Map(prev);
      const breaker = updated.get(operationName) || {
        state: 'closed' as const,
        failures: 0,
        successCount: 0,
      };

      if (success) {
        if (breaker.state === 'half-open') {
          breaker.state = 'closed';
          breaker.failures = 0;
        }
        breaker.successCount++;
      } else {
        breaker.failures++;
        breaker.lastFailureTime = new Date();

        if (breaker.failures >= 5) {
          breaker.state = 'open';
          breaker.nextRetryTime = new Date(Date.now() + 30000); // 30 seconds
        }
      }

      updated.set(operationName, breaker);
      return updated;
    });
  };

  // Priority queue implementation
  const addToQueue = (
    operation: () => Promise<any>,
    priority: number = 5,
    _operationName: string = 'unknown'
  ) => {
    const item: QueueItem = {
      id: `op-${Date.now()}-${Math.random()}`,
      operation,
      priority,
      timeout: config.timeout,
      retries: 0,
      createdAt: new Date(),
      status: 'queued',
    };

    setQueue(prev => {
      const updated = [...prev, item];
      if (config.priorityQueuing) {
        updated.sort((a, b) => b.priority - a.priority);
      }
      return updated;
    });

    return item.id;
  };

  // Resource pooling
  const acquireResource = async (type: string, amount: number = 1): Promise<boolean> => {
    if (!config.resourcePooling) return true;

    const pool = resourcePools.find(p => p.type === type);
    if (!pool) {
      // Create new pool
      setResourcePools(prev => [
        ...prev,
        {
          id: `pool-${type}`,
          type,
          available: 10 - amount,
          total: 10,
          inUse: amount,
          waitQueue: 0,
        },
      ]);
      return true;
    }

    if (pool.available >= amount) {
      setResourcePools(prev =>
        prev.map(p =>
          p.type === type ? { ...p, available: p.available - amount, inUse: p.inUse + amount } : p
        )
      );
      return true;
    }

    // Add to wait queue
    setResourcePools(prev =>
      prev.map(p => (p.type === type ? { ...p, waitQueue: p.waitQueue + 1 } : p))
    );

    // Wait and retry
    await new Promise(resolve => setTimeout(resolve, 1000));
    return acquireResource(type, amount);
  };

  const releaseResource = (type: string, amount: number = 1) => {
    if (!config.resourcePooling) return;

    setResourcePools(prev =>
      prev.map(p =>
        p.type === type
          ? {
              ...p,
              available: Math.min(p.available + amount, p.total),
              inUse: Math.max(p.inUse - amount, 0),
              waitQueue: Math.max(p.waitQueue - 1, 0),
            }
          : p
      )
    );
  };

  // Process queue with concurrency control
  const processQueue = useCallback(async () => {
    if (runningRef.current >= config.maxConcurrent || queue.length === 0) {
      return;
    }

    const item = queue[0];
    if (!item || !checkCircuitBreaker(item.id)) return;

    setQueue(prev => prev.slice(1));
    setActiveOperations(prev => [...prev, { ...item, status: 'running', startedAt: new Date() }]);
    runningRef.current++;

    // Throttling
    if (config.throttleMs > 0) {
      await new Promise(resolve => setTimeout(resolve, config.throttleMs));
    }

    try {
      // Acquire resources if needed
      await acquireResource('default');

      // Execute with timeout
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), item.timeout)
      );

      const result = await Promise.race([item.operation(), timeoutPromise]);

      // Success
      item.status = 'completed';
      item.result = result;
      item.completedAt = new Date();

      updateCircuitBreaker(item.id, true);
      updateMetrics(item.id, true, item.completedAt!.getTime() - item.startedAt!.getTime());

      setCompletedOperations(prev => [...prev, item]);
    } catch (error) {
      // Handle failure
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      if (errorMessage === 'Operation timeout') {
        onTimeoutPrevented?.(item.id);

        // Retry logic
        if (item.retries < config.retryAttempts) {
          item.retries++;
          const delay = calculateRetryDelay(item.retries);
          setTimeout(() => {
            setQueue(prev => [...prev, { ...item, status: 'queued' }]);
          }, delay);
        } else {
          item.status = 'failed';
          item.error = 'Max retries exceeded';
          setCompletedOperations(prev => [...prev, item]);
        }
      } else {
        item.status = 'failed';
        item.error = errorMessage;
        setCompletedOperations(prev => [...prev, item]);
      }

      updateCircuitBreaker(item.id, false);
      updateMetrics(item.id, false, Date.now() - item.startedAt!.getTime());
    } finally {
      releaseResource('default');
      runningRef.current--;
      setActiveOperations(prev => prev.filter(op => op.id !== item.id));

      // Process next item
      processQueue();
    }
  }, [queue, config, onTimeoutPrevented]);

  const updateMetrics = (operationName: string, success: boolean, duration: number) => {
    const existing = metricsRef.current.get(operationName) || {
      name: operationName,
      averageTime: 0,
      successRate: 0,
      timeouts: 0,
      retries: 0,
      lastRun: new Date(),
      status: 'pending' as const,
    };

    const totalRuns = (existing.successRate > 0 ? 1 / existing.successRate : 0) + 1;
    existing.averageTime = (existing.averageTime * (totalRuns - 1) + duration) / totalRuns;
    existing.successRate = success
      ? (existing.successRate * (totalRuns - 1) + 1) / totalRuns
      : (existing.successRate * (totalRuns - 1)) / totalRuns;
    existing.status = success ? 'success' : 'failed';
    existing.lastRun = new Date();

    if (!success && duration >= config.timeout) {
      existing.timeouts++;
    }

    metricsRef.current.set(operationName, existing);
    setMetrics(Array.from(metricsRef.current.values()));
  };

  // Monitor system load
  useEffect(() => {
    const interval = setInterval(() => {
      const load = (runningRef.current / config.maxConcurrent) * 100;
      setSystemLoad(load);

      // Calculate throughput
      const recentCompleted = completedOperations.filter(
        op => op.completedAt && op.completedAt.getTime() > Date.now() - 60000
      ).length;
      setThroughput(recentCompleted);

      // Adaptive scaling
      adaptiveScale();
    }, 1000);

    return () => clearInterval(interval);
  }, [config, completedOperations, adaptiveScale]);

  // Process queue when items are added
  useEffect(() => {
    processQueue();
  }, [queue, processQueue]);

  // Simulate operations for testing
  const runTestOperations = () => {
    setIsOptimizing(true);

    // Add various test operations
    for (let i = 0; i < 20; i++) {
      const priority = Math.floor(Math.random() * 10);
      const duration = Math.random() * 5000;
      const shouldFail = Math.random() > 0.8;

      addToQueue(
        () =>
          new Promise((resolve, reject) => {
            setTimeout(() => {
              if (shouldFail) {
                reject(new Error('Simulated failure'));
              } else {
                resolve(`Result ${i}`);
              }
            }, duration);
          }),
        priority,
        `test-op-${i}`
      );
    }

    setTimeout(() => setIsOptimizing(false), 10000);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
      case 'success':
        return 'text-green-600';
      case 'failed':
        return 'text-red-600';
      case 'timeout':
        return 'text-orange-600';
      case 'running':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  const getLoadColor = (load: number) => {
    if (load < 50) return 'bg-green-500';
    if (load < 80) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Intelligent Timing & Sequencing Optimizer
            <Badge variant="outline" className="ml-auto">
              AI-Powered
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* System Status */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium">System Load</span>
                </div>
                <div className="space-y-2">
                  <div className="text-2xl font-bold">{Math.round(systemLoad)}%</div>
                  <Progress value={systemLoad} className={`h-2 ${getLoadColor(systemLoad)}`} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">Throughput</span>
                </div>
                <div className="text-2xl font-bold">{throughput}</div>
                <div className="text-xs text-muted-foreground">ops/min</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm font-medium">Active</span>
                </div>
                <div className="text-2xl font-bold">{activeOperations.length}</div>
                <div className="text-xs text-muted-foreground">operations</div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Timer className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Queued</span>
                </div>
                <div className="text-2xl font-bold">{queue.length}</div>
                <div className="text-xs text-muted-foreground">waiting</div>
              </CardContent>
            </Card>
          </div>

          {/* Optimization Controls */}
          <div className="flex items-center justify-between">
            <div className="flex gap-2">
              <Button
                onClick={runTestOperations}
                disabled={isOptimizing}
                className="flex items-center gap-2"
              >
                {isOptimizing ? (
                  <>
                    <Activity className="w-4 h-4 animate-pulse" />
                    Optimizing...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4" />
                    Run Test
                  </>
                )}
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  setQueue([]);
                  setActiveOperations([]);
                  setCompletedOperations([]);
                }}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Badge variant={config.adaptiveScaling ? 'default' : 'outline'}>
                {config.adaptiveScaling ? 'Adaptive ON' : 'Adaptive OFF'}
              </Badge>
              <Badge variant={config.circuitBreakerEnabled ? 'default' : 'outline'}>
                {config.circuitBreakerEnabled ? 'Circuit Breaker ON' : 'OFF'}
              </Badge>
            </div>
          </div>

          {/* Configuration */}
          <Card>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-sm font-medium">Max Concurrent</label>
                  <input
                    type="number"
                    value={config.maxConcurrent}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, maxConcurrent: parseInt(e.target.value) }))
                    }
                    className="w-full mt-1 px-2 py-1 border rounded text-sm"
                    min="1"
                    max="50"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Timeout (ms)</label>
                  <input
                    type="number"
                    value={config.timeout}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, timeout: parseInt(e.target.value) }))
                    }
                    className="w-full mt-1 px-2 py-1 border rounded text-sm"
                    min="1000"
                    max="60000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Retry Attempts</label>
                  <input
                    type="number"
                    value={config.retryAttempts}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, retryAttempts: parseInt(e.target.value) }))
                    }
                    className="w-full mt-1 px-2 py-1 border rounded text-sm"
                    min="0"
                    max="10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Batch Size</label>
                  <input
                    type="number"
                    value={config.batchSize}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, batchSize: parseInt(e.target.value) }))
                    }
                    className="w-full mt-1 px-2 py-1 border rounded text-sm"
                    min="1"
                    max="100"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Throttle (ms)</label>
                  <input
                    type="number"
                    value={config.throttleMs}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, throttleMs: parseInt(e.target.value) }))
                    }
                    className="w-full mt-1 px-2 py-1 border rounded text-sm"
                    min="0"
                    max="1000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Retry Delay (ms)</label>
                  <input
                    type="number"
                    value={config.retryDelay}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, retryDelay: parseInt(e.target.value) }))
                    }
                    className="w-full mt-1 px-2 py-1 border rounded text-sm"
                    min="100"
                    max="10000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.adaptiveScaling}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, adaptiveScaling: e.target.checked }))
                    }
                  />
                  <span className="text-sm">Adaptive Scaling</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.priorityQueuing}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, priorityQueuing: e.target.checked }))
                    }
                  />
                  <span className="text-sm">Priority Queue</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.circuitBreakerEnabled}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, circuitBreakerEnabled: e.target.checked }))
                    }
                  />
                  <span className="text-sm">Circuit Breaker</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={config.resourcePooling}
                    onChange={e =>
                      setConfig(prev => ({ ...prev, resourcePooling: e.target.checked }))
                    }
                  />
                  <span className="text-sm">Resource Pooling</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Views */}
          <Tabs defaultValue="operations" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="operations">Operations</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="breakers">Circuit Breakers</TabsTrigger>
            </TabsList>

            <TabsContent value="operations" className="space-y-3">
              <div className="space-y-2">
                <h3 className="text-sm font-medium">Active Operations</h3>
                {activeOperations.length > 0 ? (
                  <div className="space-y-2">
                    {activeOperations.map(op => (
                      <div
                        key={op.id}
                        className="flex items-center justify-between p-2 border rounded"
                      >
                        <span className="text-sm font-medium">{op.id}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            Priority: {op.priority}
                          </Badge>
                          <Badge className="bg-blue-100 text-blue-700">Running</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">No active operations</div>
                )}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">
                  Completed Operations ({completedOperations.length})
                </h3>
                <ScrollArea className="h-[200px]">
                  <div className="space-y-2">
                    {completedOperations
                      .slice(-10)
                      .reverse()
                      .map(op => (
                        <div
                          key={op.id}
                          className="flex items-center justify-between p-2 border rounded text-sm"
                        >
                          <span className={getStatusColor(op.status)}>{op.id}</span>
                          <div className="flex items-center gap-2">
                            {op.completedAt && op.startedAt && (
                              <span className="text-xs text-muted-foreground">
                                {op.completedAt.getTime() - op.startedAt.getTime()}ms
                              </span>
                            )}
                            <Badge
                              className={
                                op.status === 'completed'
                                  ? 'bg-green-100 text-green-700'
                                  : 'bg-red-100 text-red-700'
                              }
                            >
                              {op.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </ScrollArea>
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-3">
              {metrics.length > 0 ? (
                <div className="space-y-2">
                  {metrics.map(metric => (
                    <Card key={metric.name}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{metric.name}</span>
                          <Badge className={getStatusColor(metric.status)}>{metric.status}</Badge>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mt-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Avg Time:</span>
                            <span className="ml-1 font-medium">
                              {Math.round(metric.averageTime)}ms
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Success:</span>
                            <span className="ml-1 font-medium">
                              {(metric.successRate * 100).toFixed(1)}%
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Timeouts:</span>
                            <span className="ml-1 font-medium">{metric.timeouts}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Retries:</span>
                            <span className="ml-1 font-medium">{metric.retries}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No metrics available yet
                </div>
              )}
            </TabsContent>

            <TabsContent value="resources" className="space-y-3">
              {resourcePools.length > 0 ? (
                <div className="space-y-2">
                  {resourcePools.map(pool => (
                    <Card key={pool.id}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium">{pool.type}</span>
                          <Badge variant="outline">
                            {pool.available}/{pool.total} available
                          </Badge>
                        </div>
                        <Progress value={(pool.inUse / pool.total) * 100} className="h-2" />
                        {pool.waitQueue > 0 && (
                          <div className="mt-2 text-xs text-orange-600">
                            {pool.waitQueue} operations waiting
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No resource pools active
                </div>
              )}
            </TabsContent>

            <TabsContent value="breakers" className="space-y-3">
              {circuitBreakers.size > 0 ? (
                <div className="space-y-2">
                  {Array.from(circuitBreakers.entries()).map(([name, breaker]) => (
                    <Card key={name}>
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{name}</span>
                          <Badge
                            className={
                              breaker.state === 'closed'
                                ? 'bg-green-100 text-green-700'
                                : breaker.state === 'open'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-yellow-100 text-yellow-700'
                            }
                          >
                            {breaker.state}
                          </Badge>
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                          <div>
                            <span className="text-muted-foreground">Failures:</span>
                            <span className="ml-1 font-medium">{breaker.failures}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Successes:</span>
                            <span className="ml-1 font-medium">{breaker.successCount}</span>
                          </div>
                        </div>
                        {breaker.nextRetryTime && (
                          <div className="mt-2 text-xs text-orange-600">
                            Next retry: {new Date(breaker.nextRetryTime).toLocaleTimeString()}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No circuit breakers triggered
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* AI Insights */}
          <Alert>
            <Brain className="w-4 h-4" />
            <AlertDescription>
              <strong>AI Optimization Insights:</strong>
              <ul className="mt-2 space-y-1 text-sm">
                {config.adaptiveScaling && (
                  <li>• Adaptive scaling is adjusting concurrency based on performance</li>
                )}
                {systemLoad > 80 && (
                  <li>• High system load detected - consider reducing concurrent operations</li>
                )}
                {metrics.some(m => m.successRate < 0.5) && (
                  <li>• Low success rate detected - check failing operations</li>
                )}
                {circuitBreakers.size > 0 && (
                  <li>• Circuit breakers active - some operations are being protected</li>
                )}
                {throughput < 10 && config.batchSize > 10 && (
                  <li>• Low throughput - consider reducing batch size</li>
                )}
              </ul>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}
