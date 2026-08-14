import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { MulterError } from "multer";
import { ApiError } from "../utils/ApiError";
import { isProd } from "../config/env";
import { Sentry } from "../lib/sentry";

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
    data: null,
    error: { code: "NOT_FOUND" },
  });
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: unknown, req: Request, res: Response, next: NextFunction) {
  if (err instanceof ApiError) {
    // 4xx (bad input, unauthorized, not found, etc.) are expected, routine traffic — only server
    // faults (5xx) are actual incidents worth an alert.
    if (err.statusCode >= 500) Sentry.captureException(err);
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      data: null,
      error: { code: err.code, details: err.details },
    });
  }

  if (err instanceof MulterError) {
    const message =
      err.code === "LIMIT_FILE_SIZE" ? "File must be smaller than 5MB" : "Upload failed";
    return res.status(400).json({
      success: false,
      message,
      data: null,
      error: { code: "UPLOAD_ERROR", details: err.code },
    });
  }

  if (err instanceof ZodError) {
    const fieldErrors = err.flatten().fieldErrors;
    const firstField = Object.keys(fieldErrors)[0];
    const firstMsg = Object.values(fieldErrors).flat()[0];
    const message = firstMsg
      ? `${firstField ? `${firstField}: ` : ""}${firstMsg}`
      : "Validation failed";

    return res.status(400).json({
      success: false,
      message,
      data: null,
      error: { code: "VALIDATION_ERROR", details: err.flatten() },
    });
  }

  // Never leak internal error details to the client.
  console.error("Unhandled error:", err);
  Sentry.captureException(err);
  return res.status(500).json({
    success: false,
    message: "Something went wrong. Please try again.",
    data: null,
    error: isProd ? { code: "INTERNAL_ERROR" } : { code: "INTERNAL_ERROR", details: String(err) },
  });
}
