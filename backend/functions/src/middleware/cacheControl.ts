import type {Request, Response, NextFunction} from "express";

export function publicCache(seconds: number) {
  return function cacheControlMiddleware(_req: Request, res: Response, next: NextFunction) {
    res.setHeader("Cache-Control", `public, max-age=${seconds}, s-maxage=${seconds * 5}`);
    res.setHeader("Vary", "Origin");
    next();
  };
}
