import { NextFunction, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { ApiError } from "../utils/ApiError";

const rateLimitHandler = (_req: Request, _res: Response, next: NextFunction) => {
  next(ApiError.tooManyRequests());
};

// Applies to register/login/forgot-password/resend-verification — brute-force and scraping mitigation (NFR-SEC-4).
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Tighter limit for password reset / verification requests, which trigger outbound email.
export const emailActionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});

// Same tight budget, for sensitive-but-emailless actions like changing your own password.
export const sensitiveActionRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
});
