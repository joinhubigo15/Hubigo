import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import { prisma } from "../../lib/prisma";
import * as messagesService from "../../services/business-dashboard/messages.service";
import { sendMessageSchema, startConversationSchema } from "../../schemas/business-dashboard.schema";

export const getConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await messagesService.listConversations(req.business!.id);
  return sendSuccess(res, 200, "Conversations", conversations);
});

export const getConversationMessagesHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await messagesService.getConversationMessages(req.business!.id, req.params.conversationId);
  return sendSuccess(res, 200, "Messages", result);
});

export const postReply = asyncHandler(async (req: Request, res: Response) => {
  const { body } = sendMessageSchema.parse(req.body);
  const message = await messagesService.replyAsBusiness(req.business!.id, req.params.conversationId, body);
  return sendSuccess(res, 201, "Reply sent", message);
});

export const deleteConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  await messagesService.deleteConversationAsBusiness(req.business!.id, req.params.conversationId);
  return sendSuccess(res, 200, "Conversation deleted", null);
});

// Consumer-facing "My Messages" — a logged-in user viewing/replying to their own conversations
// across every business they've messaged, mounted separately from the business-owner inbox above.
export const getMyConversations = asyncHandler(async (req: Request, res: Response) => {
  const conversations = await messagesService.listConversationsForCustomer(req.auth!.id);
  return sendSuccess(res, 200, "Conversations", conversations);
});

export const getMyConversationMessagesHandler = asyncHandler(async (req: Request, res: Response) => {
  const result = await messagesService.getConversationMessagesForCustomer(req.auth!.id, req.params.conversationId);
  return sendSuccess(res, 200, "Messages", result);
});

export const postMyReply = asyncHandler(async (req: Request, res: Response) => {
  const { body } = sendMessageSchema.parse(req.body);
  const message = await messagesService.replyAsCustomer(req.auth!.id, req.params.conversationId, body);
  return sendSuccess(res, 201, "Reply sent", message);
});

export const deleteMyConversationHandler = asyncHandler(async (req: Request, res: Response) => {
  await messagesService.deleteConversationAsCustomer(req.auth!.id, req.params.conversationId);
  return sendSuccess(res, 200, "Conversation deleted", null);
});

// Consumer-facing (any logged-in user, any business) — mounted separately, not behind
// requireOwnedBusiness. Lets the business-detail page's "Message" button actually create
// something the dashboard inbox above can show, instead of an inbox nothing can ever populate.
export const postStartConversation = asyncHandler(async (req: Request, res: Response) => {
  const business = await prisma.business.findFirst({ where: { id: req.params.businessId, deletedAt: null } });
  if (!business) throw ApiError.notFound("Business not found");

  const { body } = startConversationSchema.pick({ body: true }).parse(req.body);
  // The sender's identity comes from their own account, not client-submitted fields — a logged-
  // in user can't claim to be someone else in their own conversation.
  const sender = await prisma.user.findUnique({ where: { id: req.auth!.id }, select: { name: true, phone: true } });
  if (!sender) throw ApiError.notFound("User not found");

  const result = await messagesService.startConversation(
    business.id,
    { customerName: sender.name, customerPhone: sender.phone ?? undefined, body },
    req.auth!.id,
  );
  return sendSuccess(res, 201, "Message sent", result);
});
