import { Prisma } from "@prisma/client";

/** True for a delete/update blocked by a foreign key relationship — covers both the "known"
 * Prisma error codes (P2003/P2014, mapped from Postgres SQLSTATE 23503) and the RESTRICT-specific
 * violation (SQLSTATE 23001), which Prisma does NOT map to a known error code and instead surfaces
 * as an opaque PrismaClientUnknownRequestError — without this second check, a RESTRICT-blocked
 * delete's real cause silently falls through to a generic "Something went wrong" 500 response. */
export function isForeignKeyViolation(err: unknown): boolean {
  if (err instanceof Prisma.PrismaClientKnownRequestError && (err.code === "P2003" || err.code === "P2014")) {
    return true;
  }
  if (err instanceof Prisma.PrismaClientUnknownRequestError) {
    return /foreign key constraint|violates.*restrict|\b23001\b|\b23503\b/i.test(err.message);
  }
  return false;
}
