import { NextFunction, Request, Response } from "express";
import { verifyAdminToken } from "../lib/admin-jwt";
import { getActiveAdminProfile } from "../services/admin-auth.service";
import { ApiError } from "../utils/ApiError";

export interface AdminAuthContext {
  id: string;
  email: string;
  roleSlug: string;
  permissions: string[];
  sessionToken: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      adminAuth?: AdminAuthContext;
    }
  }
}

export async function requireAdminAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return next(ApiError.unauthorized());
  }

  try {
    const payload = verifyAdminToken(token);

    // Checks the AdminSession row still exists (not logged out/expired/revoked) rather than
    // trusting the JWT's own expiry alone — lets a logout or admin deactivation take effect
    // immediately instead of waiting out the token's TTL.
    const profile = await getActiveAdminProfile(payload.sub, payload.sid);
    if (!profile) {
      return next(ApiError.unauthorized("Session expired — please sign in again"));
    }

    req.adminAuth = {
      id: payload.sub,
      email: payload.email,
      roleSlug: payload.roleSlug,
      permissions: payload.permissions,
      sessionToken: payload.sid,
    };
    next();
  } catch {
    next(ApiError.unauthorized("Session expired — please sign in again"));
  }
}

export function requireAdminPermission(...perms: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.adminAuth) return next(ApiError.unauthorized());
    const has = req.adminAuth.permissions.includes("*") || perms.some((p) => req.adminAuth!.permissions.includes(p));
    if (!has) return next(ApiError.forbidden());
    next();
  };
}
