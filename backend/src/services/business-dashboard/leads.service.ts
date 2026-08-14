import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { LeadStatus } from "@prisma/client";

export async function listLeads(businessId: string) {
  const leads = await prisma.lead.findMany({
    where: { businessId },
    orderBy: { createdAt: "desc" },
    include: { user: { select: { id: true, name: true, email: true, phone: true } } },
  });

  // Competitor leads (sourceBusinessId set) name-drop which nearby business the lead came from.
  // sourceBusinessId is a bare FK (no Prisma relation, matching how businessId itself is modeled
  // on this table) so it's resolved with one batched lookup instead of an `include`.
  const sourceIds = [...new Set(leads.map((l) => l.sourceBusinessId).filter((id): id is string => id != null))];
  const sourceBusinesses = sourceIds.length
    ? await prisma.business.findMany({ where: { id: { in: sourceIds } }, select: { id: true, name: true, slug: true } })
    : [];
  const sourceById = new Map(sourceBusinesses.map((b) => [b.id, b]));

  return leads.map((lead) => ({
    ...lead,
    sourceBusiness: lead.sourceBusinessId ? sourceById.get(lead.sourceBusinessId) ?? null : null,
  }));
}

export async function updateLeadStatus(businessId: string, leadId: string, status: LeadStatus) {
  const existing = await prisma.lead.findFirst({ where: { id: leadId, businessId } });
  if (!existing) throw ApiError.notFound("Lead not found");
  return prisma.lead.update({ where: { id: leadId }, data: { status } });
}
