import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { CreateCityInput, UpdateCityInput, CreateAreaInput, UpdateAreaInput } from "../../schemas/admin.schema";

function isForeignKeyViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2003" || err.code === "P2014");
}

// ── Cities ───────────────────────────────────────────────────────────────────

export async function listCities() {
  const cities = await prisma.city.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { businesses: true, localities: true } } },
  });
  return cities.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    state: c.state,
    tier: c.tier,
    businessesCount: c._count.businesses,
    areasCount: c._count.localities,
    isAutoCreated: c.isAutoCreated,
    autoCreatedAcknowledged: c.autoCreatedAcknowledged,
  }));
}

export async function acknowledgeAutoCreatedCity(id: string) {
  const existing = await prisma.city.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("City not found");
  return prisma.city.update({ where: { id }, data: { autoCreatedAcknowledged: true } });
}

export async function createCity(input: CreateCityInput) {
  return prisma.city.create({
    data: { name: input.name, slug: input.slug, state: input.state, tier: input.tier, lat: input.lat, lng: input.lng },
  });
}

export async function updateCity(id: string, input: UpdateCityInput) {
  const existing = await prisma.city.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("City not found");
  return prisma.city.update({ where: { id }, data: input });
}

export async function deleteCity(id: string) {
  const existing = await prisma.city.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("City not found");
  try {
    await prisma.city.delete({ where: { id } });
  } catch (err) {
    if (isForeignKeyViolation(err)) throw ApiError.conflict("Remove its businesses and areas first");
    throw err;
  }
}

// ── Areas (Locality) ─────────────────────────────────────────────────────────

export async function listAreas(cityId?: string) {
  const areas = await prisma.locality.findMany({
    where: cityId ? { cityId } : undefined,
    orderBy: { name: "asc" },
    include: { city: { select: { name: true } }, _count: { select: { businesses: true } } },
  });
  return areas.map((a) => ({
    id: a.id,
    name: a.name,
    city: a.city.name,
    pincode: a.pincode,
    businessesCount: a._count.businesses,
  }));
}

export async function createArea(input: CreateAreaInput) {
  const city = await prisma.city.findUnique({ where: { id: input.cityId } });
  if (!city) throw ApiError.badRequest("cityId must reference an existing city");

  return prisma.locality.create({
    data: { cityId: input.cityId, name: input.name, slug: input.slug, pincode: input.pincode },
  });
}

export async function updateArea(id: string, input: UpdateAreaInput) {
  const existing = await prisma.locality.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Area not found");

  if (input.cityId) {
    const city = await prisma.city.findUnique({ where: { id: input.cityId } });
    if (!city) throw ApiError.badRequest("cityId must reference an existing city");
  }

  return prisma.locality.update({ where: { id }, data: input });
}

export async function deleteArea(id: string) {
  const existing = await prisma.locality.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Area not found");
  try {
    await prisma.locality.delete({ where: { id } });
  } catch (err) {
    if (isForeignKeyViolation(err)) throw ApiError.conflict("Remove its businesses first");
    throw err;
  }
}
