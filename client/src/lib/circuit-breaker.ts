/**
 * Advanced Circuit Breaker System with Emergent Intelligence
 * Implements adaptive thresholds, predictive failure detection, and quantum-inspired states
 */

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number;
  halfOpenRequests: number;
  volumeThreshold: number;
  errorThresholdPercentage: number;
  sleepWindow: number;
  adaptiveScaling: boolean;
  quantumMode: boolean;
  emergentLearning: boolean;
}

export interface CircuitState {
  name: string;
  state: 'closed' | 'open' | 'half-open' | 'quantum';
  failures: number;
  successes: number;
  consecutiveFailures: number;
  consecutiveSuccesses: number;
  lastFailureTime?: Date;
  nextRetryTime?: Date;
  totalRequests: number;
  errorPercentage: number;
  averageResponseTime: number;
  healthScore: number;
  stateHistory: StateTransition[];
  patterns: FailurePattern[];
  quantumProbability?: number;
}

export interface StateTransition {
  from: string;
  to: string;
  timestamp: Date;
  reason: string;
  metrics: {
    failures: number;
    successes: number;
    errorRate: number;
    responseTime: number;
  };
}

export interface FailurePattern {
  type: 'periodic' | 'cascade' | 'spike' | 'gradual' | 'random';
  confidence: number;
  predictedNextFailure?: Date;
  suggestedAction: string;
}

export interface CircuitMetrics {
  requestCount: number;
  errorCount: number;
  errorRate: number;
  p50ResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  healthScore: number;
  predictedFailureProbability: number;
}

export class EmergentCircuitBreaker {
  private states: Map<string, CircuitState> = new Map();
  private configs: Map<string, CircuitBreakerConfig> = new Map();
  private metrics: Map<string, CircuitMetrics> = new Map();
  private responseTimes: Map<string, number[]> = new Map();
  private patternDetector: PatternDetector;
  private quantumEngine: QuantumStateEngine;
  private selfHealer: SelfHealingEngine;

  constructor(private globalConfig: Partial<CircuitBreakerConfig> = {}) {
    this.patternDetector = new PatternDetector();
    this.quantumEngine = new QuantumStateEngine();
    this.selfHealer = new SelfHealingEngine();

    // Start background monitoring
    this.startMonitoring();
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(
    name: string,
    fn: () => Promise<T>,
    config?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    const breaker = this.getOrCreateBreaker(name, config);
    const state = this.states.get(name)!;

    // Check if circuit is open
    if (state.state === 'open' && !this.canAttemptReset(state)) {
      throw new Error(`Circuit breaker '${name}' is OPEN. Service unavailable.`);
    }

    // Quantum state - probabilistic execution
    if (state.state === 'quantum') {
      const shouldExecute = await this.quantumEngine.shouldExecute(state);
      if (!shouldExecute) {
        throw new Error(`Circuit breaker '${name}' in QUANTUM state denied execution.`);
      }
    }

    const startTime = Date.now();

    try {
      const result = await this.executeWithTimeout(fn, breaker.timeout);
      this.recordSuccess(name, Date.now() - startTime);
      return result;
    } catch (error) {
      this.recordFailure(name, Date.now() - startTime, error);
      throw error;
    }
  }

  /**
   * Get or create a circuit breaker instance
   */
  private getOrCreateBreaker(
    name: string,
    config?: Partial<CircuitBreakerConfig>
  ): CircuitBreakerConfig {
    if (!this.configs.has(name)) {
      const defaultConfig: CircuitBreakerConfig = {
        failureThreshold: 5,
        successThreshold: 3,
        timeout: 30000,
        halfOpenRequests: 3,
        volumeThreshold: 10,
        errorThresholdPercentage: 50,
        sleepWindow: 60000,
        adaptiveScaling: true,
        quantumMode: true,
        emergentLearning: true,
        ...this.globalConfig,
        ...config,
      };

      this.configs.set(name, defaultConfig);
      this.states.set(name, this.createInitialState(name));
      this.metrics.set(name, this.createInitialMetrics());
      this.responseTimes.set(name, []);
    }

    return this.configs.get(name)!;
  }

  /**
   * Create initial circuit state
   */
  private createInitialState(name: string): CircuitState {
    return {
      name,
      state: 'closed',
      failures: 0,
      successes: 0,
      consecutiveFailures: 0,
      consecutiveSuccesses: 0,
      totalRequests: 0,
      errorPercentage: 0,
      averageResponseTime: 0,
      healthScore: 100,
      stateHistory: [],
      patterns: [],
    };
  }

  /**
   * Create initial metrics
   */
  private createInitialMetrics(): CircuitMetrics {
    return {
      requestCount: 0,
      errorCount: 0,
      errorRate: 0,
      p50ResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      healthScore: 100,
      predictedFailureProbability: 0,
    };
  }

  /**
   * Execute with timeout protection
   */
  private async executeWithTimeout<T>(fn: () => Promise<T>, timeout: number): Promise<T> {
    return Promise.race([
      fn(),
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error('Operation timeout')), timeout)
      ),
    ]);
  }

  /**
   * Record successful execution
   */
  private recordSuccess(name: string, responseTime: number) {
    const state = this.states.get(name)!;
    const config = this.configs.get(name)!;

    state.successes++;
    state.consecutiveSuccesses++;
    state.consecutiveFailures = 0;
    state.totalRequests++;

    // Update response times
    const times = this.responseTimes.get(name)!;
    times.push(responseTime);
    if (times.length > 1000) times.shift(); // Keep last 1000

    // Update metrics
    this.updateMetrics(name);

    // State transitions
    if (state.state === 'half-open') {
      if (state.consecutiveSuccesses >= config.successThreshold) {
        this.transitionTo(name, 'closed', 'Success threshold reached');
      }
    } else if (state.state === 'quantum') {
      this.quantumEngine.updateProbability(state, true);
      if (state.quantumProbability! > 0.8) {
        this.transitionTo(name, 'closed', 'Quantum probability threshold reached');
      }
    }

    // Update health score
    state.healthScore = this.calculateHealthScore(state);

    // Emergent learning
    if (config.emergentLearning) {
      this.patternDetector.recordSuccess(state);
    }
  }

  /**
   * Record failed execution
   */
  private recordFailure(name: string, responseTime: number, error: any) {
    const state = this.states.get(name)!;
    const config = this.configs.get(name)!;

    state.failures++;
    state.consecutiveFailures++;
    state.consecutiveSuccesses = 0;
    state.totalRequests++;
    state.lastFailureTime = new Date();

    // Update metrics
    this.updateMetrics(name);

    // Detect patterns
    if (config.emergentLearning) {
      const patterns = this.patternDetector.detectPatterns(state, error);
      state.patterns = patterns;
    }

    // State transitions based on failure patterns
    if (state.state === 'closed') {
      if (this.shouldOpen(state, config)) {
        this.transitionTo(name, 'open', 'Failure threshold exceeded');
        state.nextRetryTime = new Date(Date.now() + config.sleepWindow);
      } else if (config.quantumMode && this.shouldEnterQuantum(state)) {
        this.transitionTo(name, 'quantum', 'Entering quantum state for adaptive recovery');
      }
    } else if (state.state === 'half-open') {
      this.transitionTo(name, 'open', 'Failure in half-open state');
      state.nextRetryTime = new Date(Date.now() + config.sleepWindow * 2); // Longer sleep
    } else if (state.state === 'quantum') {
      this.quantumEngine.updateProbability(state, false);
      if (state.quantumProbability! < 0.2) {
        this.transitionTo(name, 'open', 'Quantum collapse to open state');
      }
    }

    // Update health score
    state.healthScore = this.calculateHealthScore(state);

    // Trigger self-healing if needed
    if (config.adaptiveScaling && state.healthScore < 30) {
      this.selfHealer.attemptHealing(name, state, config);
    }
  }

  /**
   * Check if circuit should open
   */
  private shouldOpen(state: CircuitState, config: CircuitBreakerConfig): boolean {
    // Volume-based check
    if (state.totalRequests < config.volumeThreshold) {
      return state.consecutiveFailures >= config.failureThreshold;
    }

    // Percentage-based check
    const errorRate = (state.failures / state.totalRequests) * 100;
    return errorRate >= config.errorThresholdPercentage;
  }

  /**
   * Check if should enter quantum state
   */
  private shouldEnterQuantum(state: CircuitState): boolean {
    // Enter quantum state for uncertain conditions
    const errorRate = (state.failures / Math.max(state.totalRequests, 1)) * 100;
    return errorRate > 30 && errorRate < 70 && state.patterns.some(p => p.type === 'periodic');
  }

  /**
   * Check if can attempt reset
   */
  private canAttemptReset(state: CircuitState): boolean {
    if (!state.nextRetryTime) return true;
    return new Date() >= state.nextRetryTime;
  }

  /**
   * Transition to new state
   */
  private transitionTo(
    name: string,
    newState: 'closed' | 'open' | 'half-open' | 'quantum',
    reason: string
  ) {
    const state = this.states.get(name)!;
    const oldState = state.state;

    state.stateHistory.push({
      from: oldState,
      to: newState,
      timestamp: new Date(),
      reason,
      metrics: {
        failures: state.failures,
        successes: state.successes,
        errorRate: (state.failures / Math.max(state.totalRequests, 1)) * 100,
        responseTime: state.averageResponseTime,
      },
    });

    state.state = newState;

    // Initialize quantum probability
    if (newState === 'quantum') {
      state.quantumProbability = 0.5;
    }

    // Emit event for monitoring
    this.emitStateChange(name, oldState, newState, reason);
  }

  /**
   * Update metrics
   */
  private updateMetrics(name: string) {
    const state = this.states.get(name)!;
    const times = this.responseTimes.get(name)!;
    const metrics = this.metrics.get(name)!;

    metrics.requestCount = state.totalRequests;
    metrics.errorCount = state.failures;
    metrics.errorRate = (state.failures / Math.max(state.totalRequests, 1)) * 100;

    if (times.length > 0) {
      const sorted = [...times].sort((a, b) => a - b);
      metrics.p50ResponseTime = sorted[Math.floor(sorted.length * 0.5)];
      metrics.p95ResponseTime = sorted[Math.floor(sorted.length * 0.95)];
      metrics.p99ResponseTime = sorted[Math.floor(sorted.length * 0.99)];
      state.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
    }

    metrics.healthScore = this.calculateHealthScore(state);
    metrics.predictedFailureProbability = this.predictFailureProbability(state);
  }

  /**
   * Calculate health score (0-100)
   */
  private calculateHealthScore(state: CircuitState): number {
    const errorRate = (state.failures / Math.max(state.totalRequests, 1)) * 100;
    const responseScore = Math.max(0, 100 - state.averageResponseTime / 100);
    const stateScore = state.state === 'closed' ? 100 : state.state === 'half-open' ? 50 : 0;
    const patternScore = state.patterns.length === 0 ? 100 : 100 - state.patterns.length * 20;

    return Math.round(
      (100 - errorRate) * 0.4 + responseScore * 0.3 + stateScore * 0.2 + patternScore * 0.1
    );
  }

  /**
   * Predict failure probability
   */
  private predictFailureProbability(state: CircuitState): number {
    if (state.patterns.length === 0) return 0;

    const periodicPattern = state.patterns.find(p => p.type === 'periodic');
    if (periodicPattern && periodicPattern.predictedNextFailure) {
      const timeUntilFailure = periodicPattern.predictedNextFailure.getTime() - Date.now();
      if (timeUntilFailure < 60000) return periodicPattern.confidence; // Within 1 minute
    }

    return state.patterns.reduce((max, p) => Math.max(max, p.confidence), 0) * 0.5;
  }

  /**
   * Emit state change event
   */
  private emitStateChange(name: string, from: string, to: string, reason: string) {
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('circuit-breaker-state-change', {
          detail: { name, from, to, reason, timestamp: new Date() },
        })
      );
    }
  }

  /**
   * Start background monitoring
   */
  private startMonitoring() {
    setInterval(() => {
      this.states.forEach((state, name) => {
        const config = this.configs.get(name)!;

        // Auto-transition from open to half-open
        if (state.state === 'open' && this.canAttemptReset(state)) {
          this.transitionTo(name, 'half-open', 'Sleep window expired');
        }

        // Adaptive threshold adjustment
        if (config.adaptiveScaling) {
          this.adjustThresholds(name, state, config);
        }

        // Pattern-based predictions
        if (config.emergentLearning) {
          this.patternDetector.updatePredictions(state);
        }
      });
    }, 5000); // Check every 5 seconds
  }

  /**
   * Adjust thresholds based on patterns
   */
  private adjustThresholds(name: string, state: CircuitState, config: CircuitBreakerConfig) {
    const hour = new Date().getHours();
    const isBusinessHours = hour >= 9 && hour <= 17;

    // Adjust based on time of day
    if (isBusinessHours) {
      config.failureThreshold = Math.max(3, config.failureThreshold - 1);
      config.errorThresholdPercentage = Math.max(30, config.errorThresholdPercentage - 10);
    } else {
      config.failureThreshold = Math.min(10, config.failureThreshold + 1);
      config.errorThresholdPercentage = Math.min(70, config.errorThresholdPercentage + 10);
    }

    // Adjust based on health score
    if (state.healthScore < 50) {
      config.sleepWindow = Math.min(config.sleepWindow * 1.5, 300000); // Max 5 minutes
    } else if (state.healthScore > 80) {
      config.sleepWindow = Math.max(config.sleepWindow * 0.8, 10000); // Min 10 seconds
    }
  }

  /**
   * Get current state for a circuit
   */
  getState(name: string): CircuitState | undefined {
    return this.states.get(name);
  }

  /**
   * Get all circuit states
   */
  getAllStates(): Map<string, CircuitState> {
    return new Map(this.states);
  }

  /**
   * Reset a circuit
   */
  reset(name: string) {
    if (this.states.has(name)) {
      this.states.set(name, this.createInitialState(name));
      this.metrics.set(name, this.createInitialMetrics());
      this.responseTimes.set(name, []);
    }
  }

  /**
   * Force open a circuit
   */
  forceOpen(name: string, duration: number = 60000) {
    const state = this.states.get(name);
    if (state) {
      this.transitionTo(name, 'open', 'Manually forced open');
      state.nextRetryTime = new Date(Date.now() + duration);
    }
  }

  /**
   * Force close a circuit
   */
  forceClose(name: string) {
    const state = this.states.get(name);
    if (state) {
      this.transitionTo(name, 'closed', 'Manually forced closed');
      state.consecutiveFailures = 0;
      state.failures = 0;
    }
  }
}

/**
 * Pattern Detection Engine
 */
class PatternDetector {
  private historyWindow = 100;
  private patterns: Map<string, FailurePattern[]> = new Map();

  detectPatterns(state: CircuitState, _error: any): FailurePattern[] {
    const patterns: FailurePattern[] = [];

    // Detect periodic failures
    if (this.isPeriodicFailure(state)) {
      patterns.push({
        type: 'periodic',
        confidence: 0.8,
        predictedNextFailure: this.predictNextPeriodicFailure(state),
        suggestedAction: 'Implement scheduled maintenance window',
      });
    }

    // Detect cascade failures
    if (this.isCascadeFailure(state)) {
      patterns.push({
        type: 'cascade',
        confidence: 0.7,
        suggestedAction: 'Check dependent services',
      });
    }

    // Detect spike failures
    if (this.isSpikeFailure(state)) {
      patterns.push({
        type: 'spike',
        confidence: 0.6,
        suggestedAction: 'Implement rate limiting',
      });
    }

    return patterns;
  }

  private isPeriodicFailure(state: CircuitState): boolean {
    if (state.stateHistory.length < 3) return false;

    const failureTimes = state.stateHistory
      .filter(t => t.to === 'open')
      .map(t => t.timestamp.getTime());

    if (failureTimes.length < 3) return false;

    const intervals = [];
    for (let i = 1; i < failureTimes.length; i++) {
      intervals.push(failureTimes[i] - failureTimes[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((sum, i) => sum + Math.pow(i - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);

    return stdDev < avgInterval * 0.2; // Low variance indicates periodicity
  }

  private isCascadeFailure(state: CircuitState): boolean {
    return state.consecutiveFailures > 5 && state.averageResponseTime < 100;
  }

  private isSpikeFailure(state: CircuitState): boolean {
    const recentHistory = state.stateHistory.slice(-10);
    const failures = recentHistory.filter(t => t.to === 'open').length;
    return failures > 3 && state.totalRequests > 100;
  }

  private predictNextPeriodicFailure(state: CircuitState): Date {
    const failureTimes = state.stateHistory
      .filter(t => t.to === 'open')
      .map(t => t.timestamp.getTime());

    if (failureTimes.length < 2) {
      return new Date(Date.now() + 3600000); // Default 1 hour
    }

    const intervals = [];
    for (let i = 1; i < failureTimes.length; i++) {
      intervals.push(failureTimes[i] - failureTimes[i - 1]);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const lastFailure = failureTimes[failureTimes.length - 1];

    return new Date(lastFailure + avgInterval);
  }

  recordSuccess(state: CircuitState) {
    // Update pattern confidence based on success
    if (state.patterns) {
      state.patterns.forEach(p => {
        p.confidence *= 0.95; // Decay confidence on success
      });
    }
  }

  updatePredictions(state: CircuitState) {
    // Update predictions based on current time
    state.patterns?.forEach(pattern => {
      if (pattern.type === 'periodic' && pattern.predictedNextFailure) {
        const timeDiff = pattern.predictedNextFailure.getTime() - Date.now();
        if (timeDiff < 0) {
          // Prediction passed without failure, reduce confidence
          pattern.confidence *= 0.8;
          pattern.predictedNextFailure = this.predictNextPeriodicFailure(state);
        }
      }
    });
  }
}

/**
 * Quantum State Engine for probabilistic circuit states
 */
class QuantumStateEngine {
  async shouldExecute(state: CircuitState): Promise<boolean> {
    if (!state.quantumProbability) {
      state.quantumProbability = 0.5;
    }

    // Quantum decision with wave function collapse
    const random = Math.random();
    const shouldExecute = random < state.quantumProbability;

    // Observe and collapse wave function slightly
    if (shouldExecute) {
      state.quantumProbability = Math.min(1, state.quantumProbability * 1.1);
    } else {
      state.quantumProbability = Math.max(0, state.quantumProbability * 0.9);
    }

    return shouldExecute;
  }

  updateProbability(state: CircuitState, success: boolean) {
    if (!state.quantumProbability) {
      state.quantumProbability = 0.5;
    }

    // Quantum state evolution
    if (success) {
      state.quantumProbability = Math.min(1, state.quantumProbability + 0.1);
    } else {
      state.quantumProbability = Math.max(0, state.quantumProbability - 0.15);
    }
  }
}

/**
 * Self-Healing Engine for automatic recovery
 */
class SelfHealingEngine {
  attemptHealing(name: string, state: CircuitState, config: CircuitBreakerConfig) {
    // Implement self-healing strategies
    if (state.patterns.some(p => p.type === 'spike')) {
      // Increase timeout for spike patterns
      config.timeout = Math.min(config.timeout * 1.5, 60000);
    }

    if (state.patterns.some(p => p.type === 'cascade')) {
      // Reduce concurrency for cascade patterns
      config.halfOpenRequests = Math.max(1, config.halfOpenRequests - 1);
    }

    if (state.healthScore < 20) {
      // Emergency mode - increase all protective thresholds
      config.failureThreshold = Math.max(2, config.failureThreshold - 1);
      config.sleepWindow = Math.min(config.sleepWindow * 2, 300000);
    }
  }
}

// Export singleton instance
export const circuitBreaker = new EmergentCircuitBreaker({
  adaptiveScaling: true,
  quantumMode: true,
  emergentLearning: true,
});
