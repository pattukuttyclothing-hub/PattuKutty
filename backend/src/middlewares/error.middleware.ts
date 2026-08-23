import type { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
}

export function errorHandler(
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  console.error(`[API Error ${statusCode}]: ${message}`, err.stack);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
}
