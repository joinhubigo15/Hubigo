import { NextFunction, Request, Response } from "express";

// Reverted (2026-08-19) from CIDR-range + User-Agent heuristic blocking back to a plain exact-IP
// list: the CIDR/UA version started returning 403 for legitimate traffic (confirmed with a clean
// Chrome UA, a Googlebot UA, and a normal residential IP, all blocked) — root cause not isolated,
// so removed instead of trusted. This list is exact-match only, no bitmask math, no UA checks, on
// the individual IPs confirmed via reverse-DNS + ASN lookup as AS60068 "Datacamp Limited"
// (DataPacket), a commercial proxy/hosting network, seen scraping /api/v1/search and
// /api/v1/categories/businesses for 11+ hours. Verify any new IP the same way
// (https://ipapi.co/<ip>/json/ — look for "asn": "AS60068") before adding it here.
const BLOCKED_IPS = new Set([
  "152.233.68.98",
  "152.233.15.121",
  "152.233.15.123",
  "152.233.13.164",
  "152.233.13.165",
  "152.233.13.166",
  "152.233.76.9",
  "152.233.76.10",
  "152.233.76.11",
  "79.127.217.65",
  "79.127.217.66",
  "84.17.44.225",
  "84.17.44.226",
  "84.17.44.227",
  "84.17.44.229",
]);

function normalizeIp(ip: string): string {
  // Express/Node report IPv4 clients as "::ffff:x.x.x.x" when the underlying socket is
  // IPv6-capable — strip the mapping prefix so exact-match against plain IPv4 addresses works.
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

export function blockScrapers(req: Request, res: Response, next: NextFunction) {
  const ip = normalizeIp(req.ip ?? "");

  if (BLOCKED_IPS.has(ip)) {
    res.status(403).json({ success: false, message: "Forbidden", data: null });
    return;
  }

  next();
}
