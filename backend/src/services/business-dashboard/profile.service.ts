import crypto from "node:crypto";
import type { Business } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { getImageStorageAdapter } from "../../lib/storage/r2-storage.adapter";
import { resolveImageUrl, resolveMediaUrl } from "../../lib/storage/resolve-image-url";
import type { UpdateBusinessProfileInput, UpdateHoursInput, UpdateAmenitiesInput, UpdateCategoriesInput, ServiceInput } from "../../schemas/business-dashboard.schema";
import { listCategories } from "../taxonomy.service";

const storage = getImageStorageAdapter();
const UPLOAD_PREFIX = "owner-uploads";

function extFromMime(mime: string): string {
  return mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
}

function slugifyAmenityName(name: string): string {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export async function getFullProfile(business: Business) {
  const [amenities, services, hours, media, allAmenities, categories, allCategories] = await Promise.all([
    prisma.businessAmenity.findMany({ where: { businessId: business.id }, include: { amenity: true } }),
    prisma.businessService.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
    prisma.businessHours.findMany({ where: { businessId: business.id } }),
    prisma.businessMedia.findMany({ where: { businessId: business.id }, orderBy: { sortOrder: "asc" } }),
    prisma.amenity.findMany({ orderBy: { name: "asc" } }),
    prisma.businessCategory.findMany({ where: { businessId: business.id }, include: { category: true }, orderBy: { isPrimary: "desc" } }),
    listCategories(),
  ]);

  return {
    id: business.id,
    slug: business.slug,
    name: business.name,
    description: business.description,
    phone: business.phone,
    whatsappPhone: business.whatsappPhone,
    website: business.website,
    address: business.address,
    pincode: business.pincode,
    priceRange: business.priceRange,
    viewCount: business.viewCount,
    avgRating: business.avgRating,
    reviewCount: business.reviewCount,
    coverImageUrl: resolveImageUrl(business.coverImageUrl),
    logoUrl: resolveImageUrl(business.logoUrl),
    isVerified: business.isVerified,
    isClaimed: business.isClaimed,
    planTier: business.planTier,
    amenities: amenities.map((a) => ({ id: a.amenity.id, name: a.amenity.name, slug: a.amenity.slug, icon: a.amenity.icon })),
    allAmenities: allAmenities.map((a) => ({ id: a.id, name: a.name, slug: a.slug, icon: a.icon })),
    categories: categories.map((c) => ({ id: c.category.id, name: c.category.name, slug: c.category.slug, icon: c.category.icon, isPrimary: c.isPrimary })),
    allCategories,
    services: services.map((s) => ({ id: s.id, name: s.name, description: s.description })),
    hours: hours.map((h) => ({ day: h.day, openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed })),
    media: media.map((m) => ({ id: m.id, url: resolveMediaUrl(m), type: m.type, caption: m.caption, sortOrder: m.sortOrder })),
  };
}

export async function updateProfile(businessId: string, input: UpdateBusinessProfileInput) {
  const data: Record<string, unknown> = { ...input };
  if (input.website === "") data.website = null;
  return prisma.business.update({ where: { id: businessId }, data });
}

export async function replaceHours(businessId: string, input: UpdateHoursInput) {
  await prisma.$transaction(
    input.hours.map((h) =>
      prisma.businessHours.upsert({
        where: { businessId_day: { businessId, day: h.day } },
        create: { businessId, day: h.day, openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
        update: { openTime: h.openTime, closeTime: h.closeTime, isClosed: h.isClosed },
      }),
    ),
  );
  return prisma.businessHours.findMany({ where: { businessId } });
}

export async function replaceAmenities(businessId: string, input: UpdateAmenitiesInput) {
  await prisma.$transaction([
    prisma.businessAmenity.deleteMany({ where: { businessId } }),
    ...(input.amenityIds.length > 0
      ? [prisma.businessAmenity.createMany({ data: input.amenityIds.map((amenityId) => ({ businessId, amenityId })) })]
      : []),
  ]);
  return prisma.businessAmenity.findMany({ where: { businessId }, include: { amenity: true } });
}

// Businesses are always tagged with subcategory rows (Category rows with parentId set), never
// the top-level sector — mirrors the taxonomy convention documented on Category/BusinessCategory.
// The existing primary is preserved if it's still in the new selection, so re-saving the same set
// (or just adding another subcategory) doesn't silently reassign which one is "primary".
export async function replaceCategories(businessId: string, input: UpdateCategoriesInput) {
  const existingPrimary = await prisma.businessCategory.findFirst({ where: { businessId, isPrimary: true } });
  const primaryId = existingPrimary && input.categoryIds.includes(existingPrimary.categoryId) ? existingPrimary.categoryId : input.categoryIds[0];

  await prisma.$transaction([
    prisma.businessCategory.deleteMany({ where: { businessId } }),
    prisma.businessCategory.createMany({
      data: input.categoryIds.map((categoryId) => ({ businessId, categoryId, isPrimary: categoryId === primaryId })),
    }),
  ]);
  const rows = await prisma.businessCategory.findMany({ where: { businessId }, include: { category: true }, orderBy: { isPrimary: "desc" } });
  return rows.map((r) => ({ id: r.category.id, name: r.category.name, slug: r.category.slug, icon: r.category.icon, isPrimary: r.isPrimary }));
}

// Amenities are a shared global taxonomy (one row can be reused across every business), so a
// custom amenity is upserted by slug rather than always creating a new row — two owners typing
// "Free WiFi" land on the same Amenity instead of duplicating it. Immediately attaches it to the
// calling business, since that's the only reason an owner types a custom amenity in the first place.
export async function createCustomAmenity(businessId: string, name: string) {
  const slug = slugifyAmenityName(name);
  if (!slug) throw ApiError.badRequest("Enter a valid amenity name");

  const amenity = await prisma.amenity.upsert({
    where: { slug },
    create: { name: name.trim(), slug },
    update: {},
  });
  await prisma.businessAmenity.upsert({
    where: { businessId_amenityId: { businessId, amenityId: amenity.id } },
    create: { businessId, amenityId: amenity.id },
    update: {},
  });
  return amenity;
}

export async function addService(businessId: string, input: ServiceInput) {
  return prisma.businessService.create({ data: { businessId, name: input.name, description: input.description ?? "" } });
}

export async function updateService(businessId: string, serviceId: string, input: ServiceInput) {
  const existing = await prisma.businessService.findFirst({ where: { id: serviceId, businessId } });
  if (!existing) throw ApiError.notFound("Service not found");
  return prisma.businessService.update({ where: { id: serviceId }, data: { name: input.name, description: input.description ?? "" } });
}

export async function deleteService(businessId: string, serviceId: string) {
  const existing = await prisma.businessService.findFirst({ where: { id: serviceId, businessId } });
  if (!existing) throw ApiError.notFound("Service not found");
  await prisma.businessService.delete({ where: { id: serviceId } });
}

/** Shared by every business-dashboard domain that lets an owner upload an image (profile
 * logo/cover/gallery, product photos, ...) — one key scheme, one place to change it. */
export async function uploadOwnerImage(businessId: string, file: Express.Multer.File): Promise<string> {
  const key = `${UPLOAD_PREFIX}/${businessId}/${crypto.randomUUID()}.${extFromMime(file.mimetype)}`;
  await storage.uploadBuffer("business", key, file.buffer, file.mimetype);
  return key;
}

/** Only ever deletes owner-uploaded keys — the bulk-import enrichment pool's images are shared
 * across many businesses, so a pooled key must never be deleted just because one business
 * stopped pointing at it. */
export async function deleteOwnerImageIfOwned(key: string | null | undefined) {
  if (key && key.startsWith(`${UPLOAD_PREFIX}/`)) {
    await storage.delete("business", key).catch(() => {});
  }
}

export async function setLogo(business: Business, file: Express.Multer.File) {
  const key = await uploadOwnerImage(business.id, file);
  await deleteOwnerImageIfOwned(business.logoUrl);
  const updated = await prisma.business.update({ where: { id: business.id }, data: { logoUrl: key } });
  return resolveImageUrl(updated.logoUrl);
}

export async function setCover(business: Business, file: Express.Multer.File) {
  const key = await uploadOwnerImage(business.id, file);
  await deleteOwnerImageIfOwned(business.coverImageUrl);
  const updated = await prisma.business.update({ where: { id: business.id }, data: { coverImageUrl: key } });
  return resolveImageUrl(updated.coverImageUrl);
}

const MAX_GALLERY_IMAGES = 5;

export async function addGalleryImages(business: Business, files: Express.Multer.File[]) {
  const existingCount = await prisma.businessMedia.count({ where: { businessId: business.id } });
  if (existingCount + files.length > MAX_GALLERY_IMAGES) {
    throw ApiError.badRequest(`Gallery is limited to ${MAX_GALLERY_IMAGES} photos (${existingCount} already uploaded).`);
  }

  const maxSort = await prisma.businessMedia.aggregate({ where: { businessId: business.id }, _max: { sortOrder: true } });
  let nextSort = (maxSort._max.sortOrder ?? -1) + 1;

  const rows = [];
  for (const file of files) {
    const key = await uploadOwnerImage(business.id, file);
    rows.push({ businessId: business.id, url: key, type: "image", sortOrder: nextSort++ });
  }
  await prisma.businessMedia.createMany({ data: rows });
  return prisma.businessMedia.findMany({ where: { businessId: business.id }, orderBy: { sortOrder: "asc" } });
}

export async function deleteGalleryImage(businessId: string, mediaId: string) {
  const media = await prisma.businessMedia.findFirst({ where: { id: mediaId, businessId } });
  if (!media) throw ApiError.notFound("Image not found");
  await deleteOwnerImageIfOwned(media.url);
  await prisma.businessMedia.delete({ where: { id: mediaId } });
}
