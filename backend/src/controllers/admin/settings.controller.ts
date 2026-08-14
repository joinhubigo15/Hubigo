import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { getAdminSettings } from "../../services/admin/settings.service";

export const getSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = getAdminSettings();
  return sendSuccess(res, 200, "Settings", settings);
});
