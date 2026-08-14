import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { sendAccountSuspendedEmail } from "../../lib/email";
import type { ListUsersQuery } from "../../schemas/admin.schema";

export async function listUsers(query: ListUsersQuery) {
  const where: Prisma.UserWhereInput = { deletedAt: null };
  if (query.search) {
    where.OR = [
      { name: { contains: query.search, mode: "insensitive" } },
      { email: { contains: query.search, mode: "insensitive" } },
      { phone: { contains: query.search, mode: "insensitive" } },
    ];
  }
  if (query.status) where.isSuspended = query.status === "SUSPENDED";
  if (query.role) where.role = query.role;

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { _count: { select: { ownedBusinesses: true } } },
    }),
  ]);

  const items = users.map((u) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    phone: u.phone,
    role: u.role,
    status: (u.isSuspended ? "SUSPENDED" : "ACTIVE") as "ACTIVE" | "SUSPENDED",
    emailVerified: u.emailVerified,
    phoneVerified: u.phoneVerified,
    businessesCount: u._count.ownedBusinesses,
    createdAt: u.createdAt.toISOString(),
    lastActiveAt: u.lastActiveAt?.toISOString() ?? null,
  }));

  return { items, total, page: query.page, pageSize: query.pageSize };
}

const SAFE_USER_SELECT = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isSuspended: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

async function findActiveUser(id: string) {
  const user = await prisma.user.findFirst({ where: { id, deletedAt: null } });
  if (!user) throw ApiError.notFound("User not found");
  return user;
}

export async function suspendUser(id: string) {
  await findActiveUser(id);
  const user = await prisma.user.update({ where: { id }, data: { isSuspended: true }, select: SAFE_USER_SELECT });
  // A suspended user can no longer sign in, so an in-app notification would never be seen —
  // email is the only channel that actually reaches them.
  if (user.email) {
    sendAccountSuspendedEmail(user.email, user.name).catch((err) => console.error("[users] failed to send suspension email:", err));
  }
  return user;
}

export async function activateUser(id: string) {
  await findActiveUser(id);
  return prisma.user.update({ where: { id }, data: { isSuspended: false }, select: SAFE_USER_SELECT });
}
