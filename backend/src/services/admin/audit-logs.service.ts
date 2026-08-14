import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import type { ListAuditLogsQuery } from "../../schemas/admin.schema";

function detailsToString(details: unknown): string | null {
  if (details === null || details === undefined) return null;
  if (typeof details === "object") return JSON.stringify(details);
  return String(details);
}

export async function listAuditLogs(query: ListAuditLogsQuery) {
  const where: Prisma.AdminAuditLogWhereInput = {};
  if (query.action) where.action = query.action;
  if (query.adminId) where.adminId = query.adminId;

  const [total, logs] = await Promise.all([
    prisma.adminAuditLog.count({ where }),
    prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { admin: { select: { name: true, email: true } } },
    }),
  ]);

  const items = logs.map((l) => ({
    id: l.id,
    adminName: l.admin.name,
    adminEmail: l.admin.email,
    action: l.action,
    targetType: l.targetType,
    targetId: l.targetId,
    details: detailsToString(l.details),
    ipAddress: l.ipAddress,
    timestamp: l.createdAt.toISOString(),
  }));

  return { items, total, page: query.page, pageSize: query.pageSize };
}
