import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { adminLoginSchema } from "../schemas/admin-auth.schema";
import { loginAdmin, logoutAdmin, getActiveAdminProfile } from "../services/admin-auth.service";

function reqMeta(req: Request) {
  return { ip: req.ip, userAgent: req.headers["user-agent"] };
}

export const adminLogin = asyncHandler(async (req: Request, res: Response) => {
  const input = adminLoginSchema.parse(req.body);
  const result = await loginAdmin(input, reqMeta(req));
  return sendSuccess(res, 200, "Signed in successfully", result);
});

export const adminLogout = asyncHandler(async (req: Request, res: Response) => {
  if (req.adminAuth) {
    await logoutAdmin(req.adminAuth.sessionToken, req.adminAuth.id);
  }
  return sendSuccess(res, 200, "Logged out", null);
});

export const adminMe = asyncHandler(async (req: Request, res: Response) => {
  const profile = await getActiveAdminProfile(req.adminAuth!.id, req.adminAuth!.sessionToken);
  return sendSuccess(res, 200, "Current admin", profile);
});
