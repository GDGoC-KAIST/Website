interface LogMeta {
  requestId?: string;
  userId?: string;
  httpRequest?: {
    method: string;
    url: string;
    status: number;
    latencyMs: number;
  };
  [key: string]: unknown;
}

function log(severity: string, message: string, meta: LogMeta = {}) {
  const payload = {
    severity,
    message,
    ...meta,
    timestamp: new Date().toISOString(),
  };
  console.log(JSON.stringify(payload));
}

export const logger = {
  info: (message: string, meta?: LogMeta) => log("INFO", message, meta),
  warn: (message: string, meta?: LogMeta) => log("WARNING", message, meta),
  error: (message: string, meta?: LogMeta) => log("ERROR", message, meta),
  request: (meta: LogMeta) => log("INFO", "request_completed", meta),
};
