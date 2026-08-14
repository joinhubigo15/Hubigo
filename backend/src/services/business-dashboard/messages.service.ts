import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { notifyUser } from "../notifications.service";
import { resolveImageUrl } from "../../lib/storage/resolve-image-url";

const CUSTOMER_BUSINESS_SELECT = { id: true, name: true, slug: true, logoUrl: true, coverImageUrl: true } as const;

// coverImageUrl is stored as an R2 object key (like everywhere else images are used), so it needs
// resolving to a real URL before the customer-facing conversation list/header can render it as
// the business's avatar.
function resolveConversationBusiness<T extends { business: { logoUrl: string | null; coverImageUrl: string | null } }>(
  conversation: T,
) {
  return {
    ...conversation,
    business: {
      ...conversation.business,
      logoUrl: resolveImageUrl(conversation.business.logoUrl),
      coverImageUrl: resolveImageUrl(conversation.business.coverImageUrl),
    },
  };
}

export function listConversations(businessId: string) {
  return prisma.conversation.findMany({
    where: { businessId },
    orderBy: { lastMessageAt: "desc" },
    include: { messages: { orderBy: { createdAt: "desc" }, take: 1 } },
  });
}

export async function getConversationMessages(businessId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, businessId } });
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const messages = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });
  await prisma.message.updateMany({ where: { conversationId, sender: "CUSTOMER", isRead: false }, data: { isRead: true } });

  return { conversation, messages };
}

export async function replyAsBusiness(businessId: string, conversationId: string, body: string) {
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, businessId } });
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const [message, business] = await Promise.all([
    prisma
      .$transaction([
        prisma.message.create({ data: { conversationId, sender: "BUSINESS", body } }),
        prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
      ])
      .then(([m]) => m),
    prisma.business.findUnique({ where: { id: businessId }, select: { name: true } }),
  ]);

  if (conversation.customerUserId) {
    await notifyUser(
      conversation.customerUserId,
      "message",
      `New reply from ${business?.name ?? "a business"} 💬`,
      body,
      "/messages",
    ).catch(() => {});
  }

  return message;
}

// Deletes the whole thread (cascades to its messages) — there's no per-side "hide for me" state
// in the schema, so this removes the conversation for both the business and the customer, same
// as most simple inboxes without per-device message state.
export async function deleteConversationAsBusiness(businessId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, businessId } });
  if (!conversation) throw ApiError.notFound("Conversation not found");
  await prisma.conversation.delete({ where: { id: conversationId } });
}

// ── Consumer-facing (any logged-in customer viewing their own conversations) ──────────────────

export async function listConversationsForCustomer(customerUserId: string) {
  const conversations = await prisma.conversation.findMany({
    where: { customerUserId },
    orderBy: { lastMessageAt: "desc" },
    include: {
      messages: { orderBy: { createdAt: "desc" }, take: 1 },
      business: { select: CUSTOMER_BUSINESS_SELECT },
    },
  });
  return conversations.map(resolveConversationBusiness);
}

export async function getConversationMessagesForCustomer(customerUserId: string, conversationId: string) {
  const conversationRow = await prisma.conversation.findFirst({
    where: { id: conversationId, customerUserId },
    include: { business: { select: CUSTOMER_BUSINESS_SELECT } },
  });
  if (!conversationRow) throw ApiError.notFound("Conversation not found");

  const messages = await prisma.message.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } });
  await prisma.message.updateMany({ where: { conversationId, sender: "BUSINESS", isRead: false }, data: { isRead: true } });

  return { conversation: resolveConversationBusiness(conversationRow), messages };
}

export async function replyAsCustomer(customerUserId: string, conversationId: string, body: string) {
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, customerUserId } });
  if (!conversation) throw ApiError.notFound("Conversation not found");

  const [message, business] = await Promise.all([
    prisma
      .$transaction([
        prisma.message.create({ data: { conversationId, sender: "CUSTOMER", body } }),
        prisma.conversation.update({ where: { id: conversationId }, data: { lastMessageAt: new Date() } }),
      ])
      .then(([m]) => m),
    prisma.business.findUnique({ where: { id: conversation.businessId }, select: { ownerId: true } }),
  ]);

  if (business?.ownerId) {
    await notifyUser(business.ownerId, "message", `${conversation.customerName} sent you a message 💬`, body, "/business-dashboard/messages").catch(() => {});
  }

  return message;
}

export async function deleteConversationAsCustomer(customerUserId: string, conversationId: string) {
  const conversation = await prisma.conversation.findFirst({ where: { id: conversationId, customerUserId } });
  if (!conversation) throw ApiError.notFound("Conversation not found");
  await prisma.conversation.delete({ where: { id: conversationId } });
}

/** Consumer-facing entry point (business-detail page "Message" button) — creates a new
 * conversation (or reuses an open one from the same logged-in user) and its first message. */
export async function startConversation(
  businessId: string,
  input: { customerName: string; customerPhone?: string; body: string },
  customerUserId?: string,
) {
  const existing = customerUserId
    ? await prisma.conversation.findFirst({ where: { businessId, customerUserId }, orderBy: { lastMessageAt: "desc" } })
    : null;

  const conversation =
    existing ??
    (await prisma.conversation.create({
      data: { businessId, customerName: input.customerName, customerPhone: input.customerPhone, customerUserId },
    }));

  const [[message], business] = await Promise.all([
    prisma.$transaction([
      prisma.message.create({ data: { conversationId: conversation.id, sender: "CUSTOMER", body: input.body } }),
      prisma.conversation.update({ where: { id: conversation.id }, data: { lastMessageAt: new Date() } }),
    ]),
    prisma.business.findUnique({ where: { id: businessId }, select: { ownerId: true } }),
  ]);

  if (business?.ownerId) {
    await notifyUser(business.ownerId, "message", `${input.customerName} sent you a message 💬`, input.body, "/business-dashboard/messages").catch(() => {});
  }

  return { conversation, message };
}
