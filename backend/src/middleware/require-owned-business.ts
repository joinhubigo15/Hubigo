import { NextFunction, Request, Response } from "express";
import type { Business } from "@prisma/client";
import { getOwnedBusiness } from "../services/claims.service";
import { ApiError } from "../utils/ApiError";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      business?: Business;
    }
  }
}

/** Resolves the caller's claimed business (requireAuth must run first) and attaches it to
 * req.business — every business-dashboard route needs this exact scoping, so it lives here
 * once instead of being re-implemented per controller. */
export async function requireOwnedBusiness(req: Request, _res: Response, next: NextFunction) {
  // The dashboard's business switcher sends which of the owner's (possibly several) businesses
  // is currently selected via this header; omitted, it falls back to the most recent one.
  const requestedBusinessId = typeof req.headers["x-business-id"] === "string" ? req.headers["x-business-id"] : undefined;
  const business = await getOwnedBusiness(req.auth!.id, requestedBusinessId);
  if (!business) {
    return next(ApiError.notFound("You don't have a claimed business yet"));
  }
  req.business = business;
  next();
}
