import jwt from "jsonwebtoken";
import { env } from "../config/env";

export interface AdminTokenPayload {
  sub: string; // AdminUser.id
  sid: string; // AdminSession.token — lets requireAdminAuth revoke a session server-side
  email: string;
  roleSlug: string;
  permissions: string[];
}

export function signAdminToken(payload: AdminTokenPayload): string {
  if (!env.ADMIN_JWT_SECRET) throw new Error("ADMIN_JWT_SECRET is not configured");
  return jwt.sign(payload, env.ADMIN_JWT_SECRET, {
    expiresIn: `${env.ADMIN_SESSION_TTL_HOURS}h`,
  });
}

export function verifyAdminToken(token: string): AdminTokenPayload {
  if (!env.ADMIN_JWT_SECRET) throw new Error("ADMIN_JWT_SECRET is not configured");
  return jwt.verify(token, env.ADMIN_JWT_SECRET) as AdminTokenPayload;
}
