import type {Request, Response, NextFunction} from "express";
import type {ZodSchema} from "zod";
import {ZodError} from "zod";
import {AppError} from "../utils/appError";
import {ErrorCode} from "../utils/errorCodes";

interface ValidationSchemas {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

export function validateRequest(schemas: ValidationSchemas) {
  return async (req: Request, _res: Response, next: NextFunction) => {
    try {
      if (schemas.body) {
        const parsedBody = await parseSection("body", schemas.body, req.body);
        req.body = parsedBody;
      }
      if (schemas.query) {
        const parsedQuery = await parseSection("query", schemas.query, req.query);
        req.query = parsedQuery as any;
      }
      if (schemas.params) {
        const parsedParams = await parseSection("params", schemas.params, req.params);
        req.params = parsedParams as any;
      }
      next();
    } catch (error) {
      next(error);
    }
  };
}

async function parseSection(
  source: "body" | "query" | "params",
  schema: ZodSchema,
  payload: unknown
) {
  try {
    return await schema.parseAsync(payload);
  } catch (error) {
    if (error instanceof ZodError) {
      throw new AppError(400, ErrorCode.VALIDATION_ERROR, "Validation failed", [
        {
          source,
          issues: error.issues.map((issue) => ({
            path: issue.path.join("."),
            message: issue.message,
          })),
        },
      ]);
    }
    throw error;
  }
}
