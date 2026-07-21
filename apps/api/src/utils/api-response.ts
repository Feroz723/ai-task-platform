import type { Response } from "express";
import { ApiResponse } from "@ai-task-platform/shared-types";

export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode = 200
): void {
  const body: ApiResponse<T> = {
    success: true,
    data,
    ...(message && { message }),
  };
  res.status(statusCode).json(body);
}

export function errorResponse(
  res: Response,
  message: string,
  statusCode = 500
): void {
  const body: ApiResponse<null> = {
    success: false,
    error: { message },
  };
  res.status(statusCode).json(body);
}
