import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { hashAdminPassword } from "../admin-auth.service";
import type { CreateAdminUserInput, UpdateAdminUserInput } from "../../schemas/admin.schema";

export async function listAdminTeam() {
  const admins = await prisma.adminUser.findMany({ orderBy: { createdAt: "desc" }, include: { role: true } });
  return admins.map((a) => ({
    id: a.id,
    name: a.name,
    email: a.email,
    roleName: a.role.name,
    roleSlug: a.role.slug,
    status: a.status,
    lastLoginAt: a.lastLoginAt?.toISOString() ?? null,
    isTwoFactorEnabled: a.isTwoFactorEnabled,
  }));
}

export async function createAdminTeamMember(input: CreateAdminUserInput) {
  const existing = await prisma.adminUser.findUnique({ where: { email: input.email } });
  if (existing) throw ApiError.conflict("An admin user with this email already exists");

  const role = await prisma.adminRole.findUnique({ where: { id: input.roleId } });
  if (!role) throw ApiError.badRequest("roleId must reference an existing role");

  const passwordHash = await hashAdminPassword(input.password);
  const admin = await prisma.adminUser.create({
    data: { name: input.name, email: input.email, passwordHash, roleId: input.roleId, status: "ACTIVE" },
    include: { role: true },
  });

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    roleName: admin.role.name,
    roleSlug: admin.role.slug,
    status: admin.status,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    isTwoFactorEnabled: admin.isTwoFactorEnabled,
    note: "This email must also be added to ADMIN_ALLOWED_EMAILS in the backend .env before they can log in.",
  };
}

export async function updateAdminTeamMember(id: string, input: UpdateAdminUserInput) {
  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Admin user not found");

  if (input.roleId) {
    const role = await prisma.adminRole.findUnique({ where: { id: input.roleId } });
    if (!role) throw ApiError.badRequest("roleId must reference an existing role");
  }

  const admin = await prisma.adminUser.update({
    where: { id },
    data: {
      ...(input.name !== undefined && { name: input.name }),
      ...(input.roleId !== undefined && { roleId: input.roleId }),
      ...(input.status !== undefined && { status: input.status }),
    },
    include: { role: true },
  });

  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    roleName: admin.role.name,
    roleSlug: admin.role.slug,
    status: admin.status,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    isTwoFactorEnabled: admin.isTwoFactorEnabled,
  };
}

// Deliberately a status flip, not a hard delete — AdminAuditLog rows cascade-delete with their
// AdminUser (onDelete: Cascade in schema.prisma), and losing that history is not acceptable.
export async function deactivateAdminTeamMember(id: string) {
  const existing = await prisma.adminUser.findUnique({ where: { id } });
  if (!existing) throw ApiError.notFound("Admin user not found");
  const admin = await prisma.adminUser.update({ where: { id }, data: { status: "INACTIVE" }, include: { role: true } });
  return {
    id: admin.id,
    name: admin.name,
    email: admin.email,
    roleName: admin.role.name,
    roleSlug: admin.role.slug,
    status: admin.status,
    lastLoginAt: admin.lastLoginAt?.toISOString() ?? null,
    isTwoFactorEnabled: admin.isTwoFactorEnabled,
  };
}
