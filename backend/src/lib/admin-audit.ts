import { prisma } from "./prisma";

/**
 * Shared audit-log writer for every admin moderation/mutation action. Distinct from
 * admin-auth.service.ts's private `audit()` helper (which is scoped to login/logout session
 * events with a fixed targetType) — this one is exported so every admin/* service can log
 * against whatever targetType/targetId is relevant to it.
 */
export async function writeAdminAudit(
  adminId: string,
  action: string,
  targetType: string,
  targetId: string | null,
  req: { ip?: string; userAgent?: string },
  details?: unknown,
) {
  await prisma.adminAuditLog.create({
    data: {
      adminId,
      action,
      targetType,
      targetId,
      ipAddress: req.ip,
      userAgent: req.userAgent,
      details: details as never,
    },
  });
}

/** Pulls (ip, userAgent) out of an Express Request in the one shape writeAdminAudit expects. */
export function adminAuditReqMeta(req: { ip?: string; headers: { "user-agent"?: string } }) {
  return { ip: req.ip, userAgent: req.headers["user-agent"] };
}
