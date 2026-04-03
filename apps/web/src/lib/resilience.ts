/**
 * Resilience utilities: retry, timeout, and circuit breaker wrappers
 * for external service calls (platform APIs, Stripe, Anthropic, etc.).
 */

/* ── Helpers ──────────────────────────────────────────────── */

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/* ── withRetry ────────────────────────────────────────────── */

/**
 * Retries `fn` up to `maxRetries` times with exponential backoff.
 * The first attempt is immediate; subsequent attempts wait
 * `backoffMs * 2^(attempt-1)`.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  backoffMs: number = 500,
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries) {
        const delay = backoffMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }
  }

  throw lastError;
}

/* ── withTimeout ──────────────────────────────────────────── */

/**
 * Wraps `fn` with a timeout. Rejects with a TimeoutError if the
 * function does not resolve within `timeoutMs` milliseconds.
 */
export class TimeoutError extends Error {
  constructor(ms: number) {
    super(`Operation timed out after ${ms}ms`);
    this.name = "TimeoutError";
  }
}

export async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number = 10_000,
): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new TimeoutError(timeoutMs));
    }, timeoutMs);

    fn()
      .then((result) => {
        clearTimeout(timer);
        resolve(result);
      })
      .catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
  });
}

/* ── withCircuitBreaker ───────────────────────────────────── */

export enum CircuitState {
  CLOSED = "CLOSED",
  OPEN = "OPEN",
  HALF_OPEN = "HALF_OPEN",
}

export class CircuitBreakerOpenError extends Error {
  constructor() {
    super("Circuit breaker is open — request rejected");
    this.name = "CircuitBreakerOpenError";
  }
}

interface CircuitBreakerContext {
  state: CircuitState;
  failureCount: number;
  lastFailureTime: number;
}

/**
 * Returns a wrapped version of `fn` protected by a circuit breaker.
 *
 * - **CLOSED** (normal): calls pass through. Consecutive failures
 *   increment the counter.
 * - **OPEN** (tripped): calls are rejected immediately with
 *   `CircuitBreakerOpenError` until `resetTimeMs` has elapsed.
 * - **HALF_OPEN**: one trial call is allowed through. If it succeeds,
 *   the circuit closes; if it fails, it re-opens.
 */
export function withCircuitBreaker<T>(
  fn: () => Promise<T>,
  failureThreshold: number = 5,
  resetTimeMs: number = 30_000,
): () => Promise<T> {
  const ctx: CircuitBreakerContext = {
    state: CircuitState.CLOSED,
    failureCount: 0,
    lastFailureTime: 0,
  };

  return async function circuitBreakerWrapper(): Promise<T> {
    // If OPEN, check if enough time has passed to try again
    if (ctx.state === CircuitState.OPEN) {
      const elapsed = Date.now() - ctx.lastFailureTime;
      if (elapsed < resetTimeMs) {
        throw new CircuitBreakerOpenError();
      }
      // Transition to HALF_OPEN — allow one trial call
      ctx.state = CircuitState.HALF_OPEN;
    }

    try {
      const result = await fn();
      // Success: reset the circuit
      ctx.failureCount = 0;
      ctx.state = CircuitState.CLOSED;
      return result;
    } catch (err) {
      ctx.failureCount++;
      ctx.lastFailureTime = Date.now();

      if (
        ctx.state === CircuitState.HALF_OPEN ||
        ctx.failureCount >= failureThreshold
      ) {
        ctx.state = CircuitState.OPEN;
      }

      throw err;
    }
  };
}
