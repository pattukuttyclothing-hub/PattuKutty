import type { Request, Response, NextFunction } from "express";

export interface CustomError extends Error {
  statusCode?: number;
  code?: string;
}

export function errorHandler(
  err: CustomError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  let statusCode = err.statusCode;
  let message = err.message || "Internal Server Error";

  // Map known PostgreSQL and PostgREST error codes if statusCode is not explicitly set
  if (!statusCode) {
    const errCode = err.code;
    if (errCode === "22P02" || message.includes("invalid input syntax for type uuid")) {
      statusCode = 400;
      message = "Invalid ID or parameter format submitted.";
    } else if (errCode === "23502") {
      statusCode = 400;
      message = "Required data field is missing.";
    } else if (errCode === "23503") {
      statusCode = 400;
      message = "Referenced resource does not exist.";
    } else if (errCode === "23505") {
      statusCode = 409;
      message = "A record with this information already exists.";
    } else if (errCode === "PGRST116") {
      statusCode = 404;
      message = "Resource not found.";
    } else {
      statusCode = 500;
    }
  }

  console.error(`[API Error ${statusCode}]: ${message}`, err.stack || err);

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      statusCode,
    },
  });
}

