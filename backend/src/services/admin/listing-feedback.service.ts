import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { ListFeedbackQuery } from "../../schemas/admin.schema";

/** businessId on BusinessEditSuggestion/BusinessReport is a plain string, not a Prisma relation
 * (same pattern as SavedBusiness.businessId) — so business name/slug for admin display is joined
 * here with a second query rather than a Prisma `include`. */
async function attachBusinessInfo<T extends { businessId: string }>(rows: T[]) {
  const businessIds = [...new Set(rows.map((r) => r.businessId))];
  const businesses = await prisma.business.findMany({
    where: { id: { in: businessIds } },
    select: { id: true, name: true, slug: true },
  });
  const byId = new Map(businesses.map((b) => [b.id, b]));
  return rows.map((r) => ({ ...r, business: byId.get(r.businessId) ?? null }));
}

export async function listEditSuggestions(query: ListFeedbackQuery) {
  const where: Prisma.BusinessEditSuggestionWhereInput = {};
  if (query.status) where.status = query.status;

  const [total, rows] = await Promise.all([
    prisma.businessEditSuggestion.count({ where }),
    prisma.businessEditSuggestion.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    }),
  ]);

  const items = await attachBusinessInfo(rows);
  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function resolveEditSuggestion(id: string, status: string) {
  const result = await prisma.businessEditSuggestion.updateMany({ where: { id }, data: { status } });
  if (result.count === 0) throw ApiError.notFound("Edit suggestion not found");
}

export async function deleteEditSuggestion(id: string) {
  const result = await prisma.businessEditSuggestion.deleteMany({ where: { id } });
  if (result.count === 0) throw ApiError.notFound("Edit suggestion not found");
}

export async function listListingReports(query: ListFeedbackQuery) {
  const where: Prisma.BusinessReportWhereInput = {};
  if (query.status) where.status = query.status;

  const [total, rows] = await Promise.all([
    prisma.businessReport.count({ where }),
    prisma.businessReport.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (query.page - 1) * query.pageSize,
      take: query.pageSize,
      include: { user: { select: { id: true, name: true, email: true, phone: true } } },
    }),
  ]);

  const items = await attachBusinessInfo(rows);
  return { items, total, page: query.page, pageSize: query.pageSize };
}

export async function resolveListingReport(id: string, status: string) {
  const result = await prisma.businessReport.updateMany({ where: { id }, data: { status } });
  if (result.count === 0) throw ApiError.notFound("Report not found");
}

export async function deleteListingReport(id: string) {
  const result = await prisma.businessReport.deleteMany({ where: { id } });
  if (result.count === 0) throw ApiError.notFound("Report not found");
}
