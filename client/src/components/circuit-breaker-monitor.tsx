import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Activity, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Lock,
  Unlock,
  Zap,
  Brain,
  Atom
} from 'lucide-react';
import { circuitBreaker, CircuitState } from '@/lib/circuit-breaker';

export function CircuitBreakerMonitor() {
  const [states, setStates] = useState<Map<string, CircuitState>>(new Map());
  const [selectedBreaker, setSelectedBreaker] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Update states periodically
  useEffect(() => {
    const updateStates = () => {
      const allStates = circuitBreaker.getAllStates();
      setStates(new Map(allStates));
    };

    updateStates();
    
    if (autoRefresh) {
      const interval = setInterval(updateStates, 1000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Listen for state changes
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      setStates(prev => {
        const updated = new Map(prev);
        const state = circuitBreaker.getState(event.detail.name);
        if (state) {
          updated.set(event.detail.name, state);
        }
        return updated;
      });
    };

    window.addEventListener('circuit-breaker-state-change', handleStateChange as any);
    return () => {
      window.removeEventListener('circuit-breaker-state-change', handleStateChange as any);
    };
  }, []);

  const getStateColor = (state: string) => {
    switch (state) {
      case 'closed':
        return 'bg-green-100 text-green-700';
      case 'open':
        return 'bg-red-100 text-red-700';
      case 'half-open':
        return 'bg-yellow-100 text-yellow-700';
      case 'quantum':
        return 'bg-purple-100 text-purple-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getStateIcon = (state: string) => {
    switch (state) {
      case 'closed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'open':
        return <XCircle className="w-4 h-4 text-red-600" />;
      case 'half-open':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'quantum':
        return <Atom className="w-4 h-4 text-purple-600" />;
      default:
        return <Activity className="w-4 h-4" />;
    }
  };

  const getHealthColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const formatTime = (date?: Date) => {
    if (!date) return '-';
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    return `${Math.floor(diff / 3600000)}h ago`;
  };

  const selectedState = selectedBreaker ? states.get(selectedBreaker) : null;

  return (
    <div className="space-y-6">
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-indigo-600" />
            Circuit Breaker Monitor
            <Badge variant="outline" className="ml-auto">
              Emergent Intelligence
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Controls */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
                {autoRefresh ? 'Auto' : 'Manual'}
              </Button>
            </div>
            <div className="text-sm text-muted-foreground">
              {states.size} active circuits
            </div>
          </div>

          {/* Circuit Breakers Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from(states.entries()).map(([name, state]) => (
              <Card 
                key={name}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  selectedBreaker === name ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => setSelectedBreaker(name)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      {getStateIcon(state.state)}
                      <span className="font-medium text-sm">{name}</span>
                    </div>
                    <Badge className={getStateColor(state.state)}>
                      {state.state}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {/* Health Score */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Health</span>
                      <div className="flex items-center gap-2">
                        <Progress 
                          value={state.healthScore} 
                          className="w-20 h-2"
                        />
                        <span className={`text-xs font-medium ${getHealthColor(state.healthScore)}`}>
                          {state.healthScore}%
                        </span>
                      </div>
                    </div>

                    {/* Error Rate */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Error Rate</span>
                      <span className="text-xs font-medium">
                        {state.errorPercentage.toFixed(1)}%
                      </span>
                    </div>

                    {/* Requests */}
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Requests</span>
                      <span className="text-xs font-medium">
                        {state.totalRequests}
                      </span>
                    </div>

                    {/* Quantum Probability */}
                    {state.state === 'quantum' && state.quantumProbability !== undefined && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Quantum</span>
                        <div className="flex items-center gap-2">
                          <Atom className="w-3 h-3 text-purple-600" />
                          <span className="text-xs font-medium">
                            {(state.quantumProbability * 100).toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Last Failure */}
                    {state.lastFailureTime && (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">Last Failure</span>
                        <span className="text-xs font-medium">
                          {formatTime(state.lastFailureTime)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Patterns */}
                  {state.patterns.length > 0 && (
                    <div className="mt-3 pt-3 border-t">
                      <div className="flex items-center gap-1 flex-wrap">
                        {state.patterns.map((pattern, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {pattern.type}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Empty State */}
          {states.size === 0 && (
            <div className="text-center py-12">
              <Shield className="w-12 h-12 mx-auto mb-4 text-gray-400" />
              <p className="text-muted-foreground">No circuit breakers active</p>
              <p className="text-sm text-muted-foreground mt-2">
                Circuit breakers will appear here when operations are executed
              </p>
            </div>
          )}

          {/* Selected Breaker Details */}
          {selectedState && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>{selectedBreaker} Details</span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => circuitBreaker.reset(selectedBreaker!)}
                    >
                      <RefreshCw className="w-4 h-4" />
                      Reset
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (selectedState.state === 'open') {
                          circuitBreaker.forceClose(selectedBreaker!);
                        } else {
                          circuitBreaker.forceOpen(selectedBreaker!);
                        }
                      }}
                    >
                      {selectedState.state === 'open' ? (
                        <>
                          <Unlock className="w-4 h-4" />
                          Force Close
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          Force Open
                        </>
                      )}
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="metrics" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="metrics">Metrics</TabsTrigger>
                    <TabsTrigger value="history">History</TabsTrigger>
                    <TabsTrigger value="patterns">Patterns</TabsTrigger>
                  </TabsList>

                  <TabsContent value="metrics" className="space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Total Requests</label>
                        <p className="text-2xl font-bold">{selectedState.totalRequests}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Failures</label>
                        <p className="text-2xl font-bold text-red-600">{selectedState.failures}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Successes</label>
                        <p className="text-2xl font-bold text-green-600">{selectedState.successes}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Avg Response Time</label>
                        <p className="text-2xl font-bold">{Math.round(selectedState.averageResponseTime)}ms</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Consecutive Failures</span>
                        <Badge variant="outline">{selectedState.consecutiveFailures}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Consecutive Successes</span>
                        <Badge variant="outline">{selectedState.consecutiveSuccesses}</Badge>
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="history" className="space-y-3">
                    <ScrollArea className="h-[200px]">
                      <div className="space-y-2">
                        {selectedState.stateHistory.slice(-10).reverse().map((transition, i) => (
                          <div key={i} className="p-2 border rounded text-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Badge className={getStateColor(transition.from)}>
                                  {transition.from}
                                </Badge>
                                <span>→</span>
                                <Badge className={getStateColor(transition.to)}>
                                  {transition.to}
                                </Badge>
                              </div>
                              <span className="text-xs text-muted-foreground">
                                {formatTime(transition.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {transition.reason}
                            </p>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="patterns" className="space-y-3">
                    {selectedState.patterns.length > 0 ? (
                      <div className="space-y-3">
                        {selectedState.patterns.map((pattern, i) => (
                          <Card key={i}>
                            <CardContent className="p-3">
                              <div className="flex items-center justify-between mb-2">
                                <Badge variant="outline">{pattern.type}</Badge>
                                <span className="text-sm">
                                  Confidence: {(pattern.confidence * 100).toFixed(0)}%
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                {pattern.suggestedAction}
                              </p>
                              {pattern.predictedNextFailure && (
                                <p className="text-xs mt-2">
                                  Next predicted: {pattern.predictedNextFailure.toLocaleTimeString()}
                                </p>
                              )}
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Brain className="w-8 h-8 mx-auto mb-2" />
                        <p>No patterns detected yet</p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* AI Insights */}
          {states.size > 0 && (
            <Alert>
              <Brain className="w-4 h-4" />
              <AlertDescription>
                <strong>Emergent Intelligence Insights:</strong>
                <ul className="mt-2 space-y-1 text-sm">
                  {Array.from(states.values()).some(s => s.state === 'quantum') && (
                    <li>• Quantum states detected - system is self-adapting to uncertain conditions</li>
                  )}
                  {Array.from(states.values()).some(s => s.patterns.some(p => p.type === 'periodic')) && (
                    <li>• Periodic failure patterns detected - consider scheduled maintenance</li>
                  )}
                  {Array.from(states.values()).some(s => s.healthScore < 50) && (
                    <li>• Low health scores detected - self-healing mechanisms activated</li>
                  )}
                  {Array.from(states.values()).filter(s => s.state === 'open').length > states.size / 2 && (
                    <li>• Multiple circuits open - possible cascading failure scenario</li>
                  )}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}