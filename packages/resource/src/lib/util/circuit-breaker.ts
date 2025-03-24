import { computed, effect, Signal, signal, untracked } from '@angular/core';

/**
 * Represents the possible states of a circuit breaker.
 * - `CLOSED`: The circuit breaker is closed, and operations are allowed to proceed.
 * - `OPEN`: The circuit breaker is open, and operations are blocked.
 * - `HALF_OPEN`: The circuit breaker is in a half-open state, allowing a limited number of operations to test if the underlying issue is resolved.
 */
type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

/**
 * Represents a circuit breaker, which monitors operations and prevents failures from cascading.
 */
export type CircuitBreaker = {
  /**
   * A signal indicating whether the circuit breaker is currently closed (allowing operations).
   */
  isClosed: Signal<boolean>;
  /**
   * A signal representing the current state of the circuit breaker.
   */
  status: Signal<CircuitBreakerState>;
  /**
   * Signals a failure to the circuit breaker.  This may cause the circuit breaker to open.
   */
  fail: () => void;
  /**
   * Signals a success to the circuit breaker.  This may cause the circuit breaker to close.
   */
  success: () => void;
  /**
   * Attempts to transition the circuit breaker to the half-open state. This is typically used
   * to test if the underlying issue has been resolved after the circuit breaker has been open.
   */
  halfOpen: () => void;
  /**
   * Destroys the circuit breaker & initiates related cleanup
   */
  destroy: () => void;
};

/**
 * Options for creating a circuit breaker.
 *  - `false`: Disables circuit breaker functionality (always open).
 *  - true: Creates a new circuit breaker with default options.
 *  - `CircuitBreaker`: Provides an existing `CircuitBreaker` instance to use.
 *  - `{ treshold?: number; timeout?: number; }`: Creates a new circuit breaker with the specified options.
 */
export type CircuitBreakerOptions =
  | false
  | CircuitBreaker
  | { treshold?: number; timeout?: number };

/** @internal */
function internalCeateCircuitBreaker(
  treshold = 5,
  resetTimeout = 30000,
): CircuitBreaker {
  const halfOpen = signal(false);
  const failureCount = signal(0);

  const status = computed<CircuitBreakerState>(() => {
    if (failureCount() >= treshold) return 'CLOSED';
    return halfOpen() ? 'HALF_OPEN' : 'OPEN';
  });

  const isClosed = computed(() => status() === 'CLOSED');

  const success = () => {
    failureCount.set(0);
    halfOpen.set(false);
  };

  const tryOnce = () => {
    if (!untracked(isClosed)) return;
    halfOpen.set(true);
    failureCount.set(treshold - 1);
  };

  const effectRef = effect((cleanup) => {
    if (!isClosed()) return;

    const timeout = setTimeout(tryOnce, resetTimeout);

    return cleanup(() => clearTimeout(timeout));
  });

  const fail = () => {
    failureCount.set(failureCount() + 1);
    halfOpen.set(false);
  };

  return {
    status,
    isClosed,
    fail,
    success,
    halfOpen: tryOnce,
    destroy: () => effectRef.destroy(),
  };
}

/** @internal */
function createNeverBrokenCircuitBreaker(): CircuitBreaker {
  return {
    isClosed: computed(() => false),
    status: signal('OPEN'),
    fail: () => {
      // noop
    },
    success: () => {
      // noop
    },
    halfOpen: () => {
      // noop
    },
    destroy: () => {
      // noop
    },
  };
}

/**
 * Creates a circuit breaker instance.
 *
 * @param options - Configuration options for the circuit breaker.  Can be:
 *   - `undefined`:  Creates a "no-op" circuit breaker that is always open (never trips).
 *   - `true`: Creates a circuit breaker with default settings (threshold: 5, timeout: 30000ms).
 *   - `CircuitBreaker`:  Reuses an existing `CircuitBreaker` instance.
 *   - `{ threshold?: number; timeout?: number; }`: Creates a circuit breaker with the specified threshold and timeout.
 *
 * @returns A `CircuitBreaker` instance.
 *
 * @example
 * // Create a circuit breaker with default settings:
 * const breaker = createCircuitBreaker();
 *
 * // Create a circuit breaker with custom settings:
 * const customBreaker = createCircuitBreaker({ threshold: 10, timeout: 60000 });
 *
 * // Share a single circuit breaker instance across multiple resources:
 * const sharedBreaker = createCircuitBreaker();
 * const resource1 = queryResource(..., { circuitBreaker: sharedBreaker });
 * const resource2 = mutationResource(..., { circuitBreaker: sharedBreaker });
 */
export function createCircuitBreaker(
  opt?: CircuitBreakerOptions,
): CircuitBreaker {
  if (opt === false) return createNeverBrokenCircuitBreaker();

  if (typeof opt === 'object' && 'isClosed' in opt) return opt;

  return internalCeateCircuitBreaker(opt?.treshold, opt?.timeout);
}
