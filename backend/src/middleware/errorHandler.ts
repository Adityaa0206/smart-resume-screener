import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { logger } from "../utils/logger";
import { TextExtractionError } from "../services/pdfExtraction.service";
import { LLMServiceError } from "../services/llm.service";

export class ApiError extends Error {
  constructor(public readonly statusCode: number, message: string, public readonly details?: unknown) {
    super(message);
    this.name = "ApiError";
  }
}

interface ErrorResponseBody {
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

/**
 * Single place that maps any thrown error to a consistent JSON error shape
 * and an appropriate HTTP status code. Keeps controllers free of
 * try/catch-and-format boilerplate - they just throw and this middleware
 * translates it.
 */
export function errorHandler(err: unknown, req: Request, res: Response, _next: NextFunction): void {
  let statusCode = 500;
  let code = "INTERNAL_ERROR";
  let message = "An unexpected error occurred.";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    code = "API_ERROR";
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 400;
    code = "VALIDATION_ERROR";
    message = "Request validation failed.";
    details = err.issues;
  } else if (err instanceof TextExtractionError) {
    statusCode = 422;
    code = "TEXT_EXTRACTION_ERROR";
    message = err.message;
  } else if (err instanceof LLMServiceError) {
    statusCode = 502;
    code = "LLM_SERVICE_ERROR";
    message = "The AI extraction/matching service failed and no fallback was available.";
  } else if (err instanceof Error) {
    message = err.message;
  }

  if (statusCode >= 500) {
    logger.error("Unhandled error in request pipeline", { path: req.path, method: req.method, error: String(err) });
  } else {
    logger.warn("Request failed", { path: req.path, method: req.method, statusCode, message });
  }

  const body: ErrorResponseBody = { error: { message, code, ...(details !== undefined ? { details } : {}) } };
  res.status(statusCode).json(body);
}

/** Wraps an async Express handler so thrown/rejected errors reach errorHandler. */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    fn(req, res, next).catch(next);
  };
}
