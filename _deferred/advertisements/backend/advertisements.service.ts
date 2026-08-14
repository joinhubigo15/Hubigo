import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { CreateAdvertisementInput, UpdateAdvertisementInput } from "../../schemas/admin.schema";

// targetCityId is a plain scalar on Advertisement (not a Prisma relation — see the schema
// comment above the model), so City is joined by hand here, same pattern as
// claims.service.ts's listAllClaims manual business join.
async function withTargetCityName<T extends { targetCityId: string | null }>(ad: T) {
  if (!ad.targetCityId) return { ...ad, targetCityName: null };
  const city = await prisma.city.findUnique({ where: { id: ad.targetCityId }, select: { name: true } });
  return { ...ad, targetCityName: city?.name ?? null };
}

export async function listAdvertisements() {
  const ads = await prisma.advertisement.findMany({ orderBy: { createdAt: "desc" } });
  const cities = await prisma.city.findMany({
    where: { id: { in: ads.map((a) => a.targetCityId).filter((id): id is string => Boolean(id)) } },
    select: { id: true, name: true },
  });
  const cityById = new Map(cities.map((c) => [c.id, c.name]));
  return ads.map((a) => ({ ...a, targetCityName: a.targetCityId ? (cityById.get(a.targetCityId) ?? null) : null }));
}

export async function createAdvertisement(input: CreateAdvertisementInput) {
  const ad = await prisma.advertisement.create({
    data: {
      title: input.title,
      targetCityId: input.targetCityId,
      placement: input.placement,
      startDate: input.startDate,
      endDate: input.endDate,
    },
  });
  return withTargetCityName(ad);
}

export async function updateAdvertisement(id: string, input: UpdateAdvertisementInput) {
  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Advertisement not found");

  const ad = await prisma.advertisement.update({
    where: { id },
    data: {
      ...(input.title !== undefined && { title: input.title }),
      ...(input.targetCityId !== undefined && { targetCityId: input.targetCityId }),
      ...(input.placement !== undefined && { placement: input.placement }),
      ...(input.status !== undefined && { status: input.status }),
      ...(input.startDate !== undefined && { startDate: input.startDate }),
      ...(input.endDate !== undefined && { endDate: input.endDate }),
    },
  });
  return withTargetCityName(ad);
}

export async function deleteAdvertisement(id: string) {
  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Advertisement not found");
  await prisma.advertisement.delete({ where: { id } });
}

// This endpoint is meant to eventually be called from the public site's ad-serving surface
// (impression/click beacons), not an admin action — it still sits behind requireAdminAuth for
// now because there's no public ad-serving surface yet.
export async function trackAdvertisement(id: string, type: "impression" | "click") {
  const existing = await prisma.advertisement.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Advertisement not found");

  return prisma.advertisement.update({
    where: { id },
    data: type === "impression" ? { impressions: { increment: 1 } } : { clicks: { increment: 1 } },
  });
}
