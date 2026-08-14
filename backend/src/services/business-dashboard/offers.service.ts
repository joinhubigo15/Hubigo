import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { OfferInput } from "../../schemas/business-dashboard.schema";

export function listOffers(businessId: string) {
  return prisma.offer.findMany({ where: { businessId }, orderBy: { createdAt: "desc" } });
}

export function createOffer(businessId: string, input: OfferInput) {
  return prisma.offer.create({
    data: {
      businessId,
      title: input.title,
      description: input.description,
      discountLabel: input.discountLabel,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
}

export async function updateOffer(businessId: string, offerId: string, input: Partial<OfferInput>) {
  const existing = await prisma.offer.findFirst({ where: { id: offerId, businessId } });
  if (!existing) throw ApiError.notFound("Offer not found");
  return prisma.offer.update({ where: { id: offerId }, data: input });
}

export async function deleteOffer(businessId: string, offerId: string) {
  const existing = await prisma.offer.findFirst({ where: { id: offerId, businessId } });
  if (!existing) throw ApiError.notFound("Offer not found");
  await prisma.offer.delete({ where: { id: offerId } });
}
