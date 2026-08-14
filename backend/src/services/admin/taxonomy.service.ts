import { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { loadCommonServicesPool } from "../../importer/services/common-services-pool";
import type {
  CreateCategoryInput,
  UpdateCategoryInput,
  CreateSubcategoryInput,
  UpdateSubcategoryInput,
} from "../../schemas/admin.schema";

function isForeignKeyViolation(err: unknown): boolean {
  return err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2003" || err.code === "P2014");
}

// ── Categories (top-level, parentId: null) ──────────────────────────────────

export async function listCategories() {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    orderBy: { name: "asc" },
    include: { _count: { select: { children: true } } },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    icon: c.icon,
    description: c.description,
    subcategoriesCount: c._count.children,
  }));
}

export async function createCategory(input: CreateCategoryInput) {
  return prisma.category.create({
    data: { name: input.name, slug: input.slug, icon: input.icon, description: input.description, parentId: null },
  });
}

export async function updateCategory(id: string, input: UpdateCategoryInput) {
  const existing = await prisma.category.findFirst({ where: { id, parentId: null } });
  if (!existing) throw ApiError.notFound("Category not found");
  return prisma.category.update({ where: { id }, data: input });
}

export async function deleteCategory(id: string) {
  const existing = await prisma.category.findFirst({ where: { id, parentId: null } });
  if (!existing) throw ApiError.notFound("Category not found");
  try {
    await prisma.category.delete({ where: { id } });
  } catch (err) {
    if (isForeignKeyViolation(err)) throw ApiError.conflict("Remove its subcategories and listings first");
    throw err;
  }
}

// ── Subcategories (Category rows with parentId set) ─────────────────────────

export async function listSubcategories() {
  const subcategories = await prisma.category.findMany({
    where: { parentId: { not: null } },
    orderBy: { name: "asc" },
    include: { parent: true, _count: { select: { descriptionTemplates: true } } },
  });
  const servicesBySlug = loadCommonServicesPool();

  return subcategories.map((s) => ({
    id: s.id,
    name: s.name,
    slug: s.slug,
    sector: s.parent?.name ?? "",
    commonServices: (servicesBySlug.get(s.slug) ?? []).slice(0, 3).map((svc) => svc.name),
    templatesCount: s._count.descriptionTemplates,
  }));
}

export async function createSubcategory(input: CreateSubcategoryInput) {
  const parent = await prisma.category.findFirst({ where: { id: input.parentId, parentId: null } });
  if (!parent) throw ApiError.badRequest("parentId must reference an existing top-level category");

  return prisma.category.create({
    data: {
      name: input.name,
      slug: input.slug,
      icon: input.icon,
      description: input.description,
      parentId: input.parentId,
    },
  });
}

export async function updateSubcategory(id: string, input: UpdateSubcategoryInput) {
  const existing = await prisma.category.findFirst({ where: { id, parentId: { not: null } } });
  if (!existing) throw ApiError.notFound("Subcategory not found");

  if (input.parentId) {
    const parent = await prisma.category.findFirst({ where: { id: input.parentId, parentId: null } });
    if (!parent) throw ApiError.badRequest("parentId must reference an existing top-level category");
  }

  return prisma.category.update({ where: { id }, data: input });
}

export async function deleteSubcategory(id: string) {
  const existing = await prisma.category.findFirst({ where: { id, parentId: { not: null } } });
  if (!existing) throw ApiError.notFound("Subcategory not found");
  try {
    await prisma.category.delete({ where: { id } });
  } catch (err) {
    if (isForeignKeyViolation(err)) throw ApiError.conflict("Remove its subcategories and listings first");
    throw err;
  }
}
