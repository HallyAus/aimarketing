/**
 * Structured JSON logger.
 *
 * Outputs JSON lines to stdout/stderr for easy ingestion by log aggregators.
 * Debug messages only appear in development.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  [key: string]: unknown;
}

function formatEntry(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): string {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    message,
    ...meta,
  };
  return JSON.stringify(entry);
}

function write(
  level: LogLevel,
  message: string,
  meta?: Record<string, unknown>,
): void {
  const line = formatEntry(level, message, meta);

  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

export const logger = {
  debug(message: string, meta?: Record<string, unknown>): void {
    if (process.env.NODE_ENV === "development") {
      write("debug", message, meta);
    }
  },

  info(message: string, meta?: Record<string, unknown>): void {
    write("info", message, meta);
  },

  warn(message: string, meta?: Record<string, unknown>): void {
    write("warn", message, meta);
  },

  error(message: string, meta?: Record<string, unknown>): void {
    write("error", message, meta);
  },
};
