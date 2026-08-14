import { Request, Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { sendSuccess } from "../utils/ApiResponse";
import { submitContactMessage } from "../services/contact.service";
import { submitContactMessageSchema } from "../schemas/contact.schema";

export const postContactMessage = asyncHandler(async (req: Request, res: Response) => {
  const input = submitContactMessageSchema.parse(req.body);
  const message = await submitContactMessage(req.auth!.id, input);
  return sendSuccess(res, 201, "Message sent", message);
});
