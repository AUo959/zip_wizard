import { useState, useEffect, useCallback } from 'react';
import { circuitBreaker, CircuitState } from '@/lib/circuit-breaker';
import { useToast } from '@/hooks/use-toast';

interface UseCircuitBreakerOptions {
  name: string;
  failureThreshold?: number;
  timeout?: number;
  onStateChange?: (state: CircuitState) => void;
}

export function useCircuitBreaker(options: UseCircuitBreakerOptions) {
  const { name, failureThreshold = 5, timeout = 30000, onStateChange } = options;
  const [state, setState] = useState<CircuitState | undefined>();
  const [isExecuting, setIsExecuting] = useState(false);
  const { toast } = useToast();

  // Listen for state changes
  useEffect(() => {
    const handleStateChange = (event: CustomEvent) => {
      if (event.detail.name === name) {
        const newState = circuitBreaker.getState(name);
        if (newState) {
          setState(newState);
          onStateChange?.(newState);
          
          // Show toast for state transitions
          if (event.detail.to === 'open') {
            toast({
              title: 'Circuit Breaker Opened',
              description: `Service '${name}' is temporarily unavailable due to failures.`,
              variant: 'destructive'
            });
          } else if (event.detail.to === 'closed' && event.detail.from === 'open') {
            toast({
              title: 'Service Recovered',
              description: `Service '${name}' is now available.`,
            });
          }
        }
      }
    };

    window.addEventListener('circuit-breaker-state-change', handleStateChange as any);
    
    // Get initial state
    const initialState = circuitBreaker.getState(name);
    if (initialState) {
      setState(initialState);
    }

    return () => {
      window.removeEventListener('circuit-breaker-state-change', handleStateChange as any);
    };
  }, [name, onStateChange, toast]);

  // Execute with circuit breaker protection
  const execute = useCallback(async <T,>(
    fn: () => Promise<T>
  ): Promise<T> => {
    setIsExecuting(true);
    try {
      const result = await circuitBreaker.execute(name, fn, {
        failureThreshold,
        timeout
      });
      return result;
    } catch (error) {
      // Re-throw the error after circuit breaker handles it
      throw error;
    } finally {
      setIsExecuting(false);
      // Update state after execution
      const newState = circuitBreaker.getState(name);
      if (newState) {
        setState(newState);
      }
    }
  }, [name, failureThreshold, timeout]);

  // Force open the circuit
  const forceOpen = useCallback((duration?: number) => {
    circuitBreaker.forceOpen(name, duration);
    const newState = circuitBreaker.getState(name);
    if (newState) setState(newState);
  }, [name]);

  // Force close the circuit
  const forceClose = useCallback(() => {
    circuitBreaker.forceClose(name);
    const newState = circuitBreaker.getState(name);
    if (newState) setState(newState);
  }, [name]);

  // Reset the circuit
  const reset = useCallback(() => {
    circuitBreaker.reset(name);
    const newState = circuitBreaker.getState(name);
    if (newState) setState(newState);
  }, [name]);

  return {
    execute,
    state,
    isExecuting,
    forceOpen,
    forceClose,
    reset,
    isOpen: state?.state === 'open',
    isHalfOpen: state?.state === 'half-open',
    isClosed: state?.state === 'closed',
    isQuantum: state?.state === 'quantum',
    healthScore: state?.healthScore || 100,
    errorRate: state ? (state.failures / Math.max(state.totalRequests, 1)) * 100 : 0
  };
}