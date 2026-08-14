import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { ListLeadsQuery } from "../../schemas/admin.schema";

export async function listLeads(query: ListLeadsQuery) {
  const where: Prisma.LeadWhereInput = {};
  if (query.status) where.status = query.status;
  if (query.type) where.type = query.type;

  const [total, leads] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
    }),
  ]);

  const businesses = await prisma.business.findMany({
    where: { id: { in: leads.map((l) => l.businessId) } },
    select: { id: true, name: true },
  });
  const businessById = new Map(businesses.map((b) => [b.id, b]));

  const items = leads.map((l) => ({
    id: l.id,
    businessName: businessById.get(l.businessId)?.name ?? "Unknown business",
    type: l.type,
    phone: l.phone,
    email: l.email,
    message: l.message,
    status: l.status,
    createdAt: l.createdAt.toISOString(),
  }));

  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function deleteLead(id: string) {
  const existing = await prisma.lead.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Lead not found");
  await prisma.lead.delete({ where: { id } });
}
