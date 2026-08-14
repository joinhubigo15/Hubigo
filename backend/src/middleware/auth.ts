import { NextFunction, Request, Response } from "express";
import type { Role } from "@prisma/client";
import { verifyAccessToken } from "../lib/jwt";
import { ApiError } from "../utils/ApiError";

export interface AuthContext {
  id: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    // Named `auth`, distinct from passport's own `req.user`, so the two
    // typings (ours: {id, role}; passport's: the Prisma User set during
    // the OAuth callback) never collide via interface merging.
    interface Request {
      auth?: AuthContext;
    }
  }
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    return next(ApiError.unauthorized());
  }

  try {
    const payload = verifyAccessToken(token);
    req.auth = { id: payload.sub, role: payload.role };
    next();
  } catch {
    next(ApiError.unauthorized("Session expired — please sign in again"));
  }
}

/** Like requireAuth, but never rejects — populates req.auth when a valid token is present,
 * otherwise proceeds unauthenticated. For routes that behave differently for logged-in users
 * (e.g. attributing an action to them) without requiring login to use the route at all. */
export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) return next();

  try {
    const payload = verifyAccessToken(token);
    req.auth = { id: payload.sub, role: payload.role };
  } catch {
    // Invalid/expired token on an optional-auth route — proceed unauthenticated.
  }
  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth) {
      return next(ApiError.unauthorized());
    }
    if (!roles.includes(req.auth.role)) {
      return next(ApiError.forbidden());
    }
    next();
  };
}
