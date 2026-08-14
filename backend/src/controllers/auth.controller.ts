import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { ApiError } from "../utils/ApiError";
import { setRefreshCookie, clearRefreshCookie } from "../utils/cookies";
import {
  refreshSession,
  logoutUser,
  verifyEmail,
  resendVerificationEmail,
} from "../services/auth.service";
import {
  resendVerificationSchema,
  verifyEmailSchema,
} from "../schemas/auth.schema";

export const refresh = asyncHandler(async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies?.["hubigo_rt"];
  if (!rawRefreshToken) {
    throw ApiError.unauthorized("Session expired — please sign in again");
  }

  const { user, accessToken, refreshToken } = await refreshSession(rawRefreshToken);
  setRefreshCookie(res, refreshToken);
  return sendSuccess(res, 200, "Session refreshed", { user, accessToken });
});

export const logout = asyncHandler(async (req: Request, res: Response) => {
  const rawRefreshToken = req.cookies?.["hubigo_rt"];
  await logoutUser(rawRefreshToken);
  clearRefreshCookie(res);
  return sendSuccess(res, 200, "Logged out", null);
});

export const verifyEmailHandler = asyncHandler(async (req: Request, res: Response) => {
  const { token } = verifyEmailSchema.parse(req.body);
  await verifyEmail(token);
  return sendSuccess(res, 200, "Email address verified successfully", null);
});

export const resendVerification = asyncHandler(async (req: Request, res: Response) => {
  const { email } = resendVerificationSchema.parse(req.body);
  await resendVerificationEmail(email);
  return sendSuccess(res, 200, "If an account exists, a new verification email has been sent.", null);
});
