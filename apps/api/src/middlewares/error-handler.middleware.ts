import type { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";
import { getEnv } from "../config/env";

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export function errorHandler(
  err: AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode ?? 500;
  const isOperational = err.isOperational ?? false;

  if (!isOperational) {
    logger.error("Unexpected error", {
      message: err.message,
      stack: err.stack,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message: isOperational ? err.message : "Internal server error",
      ...(getEnv().NODE_ENV === "development" && { stack: err.stack }),
    },
  });
}

export function createAppError(
  message: string,
  statusCode: number,
  isOperational = true
): AppError {
  const error = new Error(message) as AppError;
  error.statusCode = statusCode;
  error.isOperational = isOperational;
  return error;
}
