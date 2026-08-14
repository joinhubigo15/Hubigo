import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import type { SubmitContactMessageInput } from "../schemas/contact.schema";

export async function submitContactMessage(userId: string, input: SubmitContactMessageInput) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("User not found");

  return prisma.contactMessage.create({
    data: {
      userId,
      name: input.name,
      email: input.email,
      subject: input.subject,
      message: input.message,
    },
  });
}
