import type {Request, Response, NextFunction} from "express";

export interface RateLimitStore {
  consume(key: string, windowMs: number): Promise<{count: number; reset: number}>;
}

interface MemoryEntry {
  count: number;
  reset: number;
}

export class MemoryRateLimitStore implements RateLimitStore {
  private readonly store = new Map<string, MemoryEntry>();

  async consume(key: string, windowMs: number): Promise<{count: number; reset: number}> {
    const now = Date.now();
    const entry = this.store.get(key);
    if (!entry || entry.reset < now) {
      const reset = now + windowMs;
      this.store.set(key, {count: 1, reset});
      return {count: 1, reset};
    }

    entry.count += 1;
    return {count: entry.count, reset: entry.reset};
  }
}

export const defaultRateLimitStore = new MemoryRateLimitStore();

interface RateLimitOptions {
  max: number;
  windowMs: number;
  keyGenerator: (req: Request) => string;
  store?: RateLimitStore;
}

export function rateLimit(options: RateLimitOptions) {
  const store = options.store ?? defaultRateLimitStore;
  return async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
      const key = options.keyGenerator(req);
      const {count, reset} = await store.consume(key, options.windowMs);
      if (count > options.max) {
        const retrySeconds = Math.ceil((reset - Date.now()) / 1000);
        res.setHeader("Retry-After", Math.max(retrySeconds, 1));
        res.status(429).json({
          error: {
            code: "TOO_MANY_REQUESTS",
            message: "Rate limit exceeded. Please try again later.",
          },
        });
        return;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}
