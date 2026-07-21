type LogLevel = "info" | "warn" | "error" | "debug";

function formatLog(level: LogLevel, message: string, meta: unknown[]): string {
  const entry: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    level,
    message,
  };

  if (meta.length > 0) {
    entry.meta = meta.length === 1 ? meta[0] : meta;
  }

  return JSON.stringify(entry);
}

export const logger = {
  info: (message: string, ...meta: unknown[]): void => {
    console.log(formatLog("info", message, meta));
  },
  warn: (message: string, ...meta: unknown[]): void => {
    console.warn(formatLog("warn", message, meta));
  },
  error: (message: string, ...meta: unknown[]): void => {
    console.error(formatLog("error", message, meta));
  },
  debug: (message: string, ...meta: unknown[]): void => {
    if (process.env.NODE_ENV !== "production") {
      console.debug(formatLog("debug", message, meta));
    }
  },
};
