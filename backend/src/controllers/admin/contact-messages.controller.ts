import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { listContactMessages, markContactMessageRead, deleteContactMessage } from "../../services/admin/contact-messages.service";
import { listContactMessagesQuerySchema } from "../../schemas/admin.schema";

export const getContactMessages = asyncHandler(async (req: Request, res: Response) => {
  const query = listContactMessagesQuerySchema.parse(req.query);
  const result = await listContactMessages(query);
  return sendSuccess(res, 200, "Contact messages", result);
});

export const postMarkContactMessageRead = asyncHandler(async (req: Request, res: Response) => {
  await markContactMessageRead(req.params.id);
  return sendSuccess(res, 200, "Message marked as read", null);
});

export const deleteContactMessageHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteContactMessage(req.params.id);
  return sendSuccess(res, 200, "Message deleted", { id: req.params.id });
});
