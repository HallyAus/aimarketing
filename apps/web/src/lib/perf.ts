/**
 * Performance timer utility.
 *
 * Measures execution time of async functions and logs a warning
 * when execution exceeds 1000ms.
 */

import { logger } from "@/lib/logger";

/**
 * Execute `fn`, measure its wall-clock duration, and log the result.
 * Warns automatically if execution takes longer than 1000ms.
 */
export async function timed<T>(
  label: string,
  fn: () => Promise<T>,
  meta?: Record<string, unknown>,
): Promise<T> {
  const start = performance.now();

  try {
    const result = await fn();
    const durationMs = Math.round(performance.now() - start);

    const logMeta = { durationMs, ...meta };

    if (durationMs > 1000) {
      logger.warn(`Slow operation: ${label}`, logMeta);
    } else {
      logger.debug(`${label}`, logMeta);
    }

    return result;
  } catch (error) {
    const durationMs = Math.round(performance.now() - start);
    logger.error(`Failed: ${label}`, {
      durationMs,
      error: error instanceof Error ? error.message : String(error),
      ...meta,
    });
    throw error;
  }
}
