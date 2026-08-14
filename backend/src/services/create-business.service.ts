import { prisma } from "../lib/prisma";
import { ApiError } from "../utils/ApiError";
import { generateBusinessSlug } from "../importer/utils/slug";
import type { CreateBusinessInput } from "../schemas/businesses.schema";

function slugifyCityName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

/**
 * Resolves the city for a new listing. If the owner picked from the seeded list, that's it.
 * Otherwise (add-listing form's "my city isn't listed" path) find-or-create a City by slug —
 * find, not always-create, so two owners typing "Mysuru" in the same week land on one city
 * instead of duplicating it. A freshly created row is flagged isAutoCreated so it surfaces in
 * the admin console instead of silently entering the taxonomy unreviewed.
 */
async function resolveCity(input: CreateBusinessInput) {
  if (input.cityId) {
    const city = await prisma.city.findUnique({ where: { id: input.cityId }, select: { id: true, slug: true } });
    if (!city) throw ApiError.badRequest("Selected city was not found");
    return city;
  }

  const slug = slugifyCityName(input.newCityName!);
  if (!slug) throw ApiError.badRequest("Enter a valid city name");

  return prisma.city.upsert({
    where: { slug },
    create: { name: input.newCityName!.trim(), slug, state: input.newCityState!.trim(), isAutoCreated: true },
    update: {},
    select: { id: true, slug: true },
  });
}

// Self-service listing — the counterpart to claims.service.ts's ownership-transfer path.
// Unlike a claim, there's no existing Business row to attach to: this creates one outright,
// owned by the submitter, live immediately (no admin moderation queue for v1).
export async function createBusiness(userId: string, input: CreateBusinessInput) {
  const [category, city, user] = await Promise.all([
    prisma.category.findUnique({ where: { id: input.categoryId }, select: { id: true } }),
    resolveCity(input),
    prisma.user.findUnique({ where: { id: userId }, select: { role: true } }),
  ]);
  if (!category) throw ApiError.badRequest("Selected category was not found");

  // Guards against the same owner accidentally listing the same business twice — e.g. a slow/failed
  // photo upload after a successful create leaving the wizard's success screen unclear, prompting a
  // resubmit of the same form. Scoped to this owner + name + city (not global) so two different
  // owners can legitimately run same-named businesses (e.g. a franchise) without being blocked.
  const duplicate = await prisma.business.findFirst({
    where: {
      ownerId: userId,
      cityId: city.id,
      deletedAt: null,
      name: { equals: input.name.trim(), mode: "insensitive" },
    },
    select: { slug: true },
  });
  if (duplicate) {
    throw ApiError.conflict(
      `You already have a listing named "${input.name.trim()}" in this city — check your Business Dashboard instead of creating another.`
    );
  }

  const slug = generateBusinessSlug(input.name, city.slug);
  const now = new Date();

  return prisma.$transaction(async (tx) => {
    const business = await tx.business.create({
      data: {
        slug,
        name: input.name,
        description: input.description,
        ownerId: userId,
        isClaimed: true,
        claimedAt: now,
        claimVerificationMethod: "self_listed",
        cityId: city.id,
        address: input.address,
        pincode: input.pincode,
        phone: input.phone,
        whatsappPhone: input.whatsappPhone || null,
        website: input.website || null,
        categories: { create: { categoryId: input.categoryId, isPrimary: true } },
      },
    });

    // Same role-promotion pattern used by claim approval (claims.service.ts) — listing a
    // business is another way a plain "user" account becomes a "business_owner".
    if (user && user.role === "user") {
      await tx.user.update({ where: { id: userId }, data: { role: "business_owner" } });
    }

    return business;
  });
}
