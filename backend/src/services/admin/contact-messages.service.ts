import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { ListContactMessagesQuery } from "../../schemas/admin.schema";

export async function listContactMessages(query: ListContactMessagesQuery) {
  const where: Prisma.ContactMessageWhereInput = {};
  if (query.isRead !== undefined) where.isRead = query.isRead;

  const [total, messages] = await Promise.all([
    prisma.contactMessage.count({ where }),
    prisma.contactMessage.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    }),
  ]);

  const items = messages.map((m) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    subject: m.subject,
    message: m.message,
    isRead: m.isRead,
    createdAt: m.createdAt.toISOString(),
    sender: m.user ? { id: m.user.id, name: m.user.name, email: m.user.email, phone: m.user.phone } : null,
  }));

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function markContactMessageRead(id: string) {
  const result = await prisma.contactMessage.updateMany({ where: { id }, data: { isRead: true } });
  if (result.count === 0) throw ApiError.notFound("Message not found");
}

export async function deleteContactMessage(id: string) {
  const result = await prisma.contactMessage.deleteMany({ where: { id } });
  if (result.count === 0) throw ApiError.notFound("Message not found");
}
