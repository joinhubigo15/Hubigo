import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import type { SuggestEditInput, ReportListingInput } from "../schemas/businesses.schema";

async function assertBusinessExists(businessId: string) {
  const business = await prisma.business.findFirst({
    where: { id: businessId, deletedAt: null },
    select: { id: true },
  });
  if (!business) throw ApiError.notFound("Business not found");
}

/** Customer "Suggest an Edit" submission from a business detail page — visible to admins via
 * GET /admin/edit-suggestions. Doesn't require login (userId nullable). */
export async function createEditSuggestion(businessId: string, userId: string | null, input: SuggestEditInput) {
  await assertBusinessExists(businessId);
  return prisma.businessEditSuggestion.create({
    data: { businessId, userId, type: input.type, details: input.details },
  });
}

/** Customer "Report Listing" submission — visible to admins via GET /admin/listing-reports.
 * Doesn't require login (userId nullable). */
export async function createListingReport(businessId: string, userId: string | null, input: ReportListingInput) {
  await assertBusinessExists(businessId);
  return prisma.businessReport.create({
    data: { businessId, userId, reason: input.reason, details: input.details },
  });
}
