import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import type { CreateAdminRoleInput, UpdateAdminRoleInput } from "../../schemas/admin.schema";

export async function listAdminRoles() {
  const roles = await prisma.adminRole.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { admins: true } } },
  });
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    description: r.description,
    adminsCount: r._count.admins,
    permissions: r.permissions,
  }));
}

export async function createAdminRole(input: CreateAdminRoleInput) {
  return prisma.adminRole.create({
    data: { name: input.name, slug: input.slug, description: input.description, permissions: input.permissions },
  });
}

export async function updateAdminRole(id: string, input: UpdateAdminRoleInput) {
  const existing = await prisma.adminRole.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Role not found");
  return prisma.adminRole.update({ where: { id }, data: input });
}

export async function deleteAdminRole(id: string) {
  const existing = await prisma.adminRole.findUnique({ where: { id }, include: { _count: { select: { admins: true } } } });
  if (!existing) throw ApiError.notFound("Role not found");
  if (existing._count.admins > 0) throw ApiError.conflict("Reassign admins off this role first");
  await prisma.adminRole.delete({ where: { id } });
}
