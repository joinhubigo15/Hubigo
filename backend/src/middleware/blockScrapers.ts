import { NextFunction, Request, Response } from "express";

// Confirmed via reverse-DNS + ASN lookup (2026-08-19): every one of these ranges belongs to
// AS60068 "Datacamp Limited" (trading as DataPacket), a commercial proxy/hosting network — never
// a residential or mobile ISP. Observed running two coordinated scrapes against /api/v1/search
// and /api/v1/categories — a raw script (User-Agent: node) and a browser-emulated one (spoofed
// Chrome/Firefox/Safari UAs) — systematically enumerating every category x city combination for
// 11+ hours straight. If a new range from the same actor shows up, verify it first
// (https://ipapi.co/<ip>/json/ — look for "asn": "AS60068") before adding it here.
const BLOCKED_CIDRS = [
  "152.233.76.0/24",
  "152.233.39.0/24",
  "152.233.15.0/24",
  "152.233.13.0/24",
  "152.233.68.0/24",
  "79.127.217.0/24",
  "84.17.44.0/23",
];

function ipToInt(ip: string): number | null {
  const parts = ip.split(".").map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p) || p < 0 || p > 255)) return null;
  return ((parts[0] << 24) | (parts[1] << 16) | (parts[2] << 8) | parts[3]) >>> 0;
}

function isIpInCidr(ip: string, cidr: string): boolean {
  const [range, bitsStr] = cidr.split("/");
  const bits = Number(bitsStr);
  const ipInt = ipToInt(ip);
  const rangeInt = ipToInt(range);
  if (ipInt === null || rangeInt === null) return false;
  const mask = bits === 0 ? 0 : (~0 << (32 - bits)) >>> 0;
  return (ipInt & mask) === (rangeInt & mask);
}

function normalizeIp(ip: string): string {
  // Express/Node report IPv4 clients as "::ffff:x.x.x.x" when the underlying socket is
  // IPv6-capable — strip the mapping prefix so CIDR matching against plain IPv4 ranges works.
  return ip.startsWith("::ffff:") ? ip.slice(7) : ip;
}

// A real browser or real Googlebot always sends a descriptive User-Agent. This catches the raw
// scripted half of the scrape (literally "node", or no header at all) independent of IP — so it
// keeps working even after the operator rotates to a network range not yet in the list above.
const SUSPICIOUS_USER_AGENTS = new Set(["node", ""]);

export function blockScrapers(req: Request, res: Response, next: NextFunction) {
  const ip = normalizeIp(req.ip ?? "");
  const ua = (req.get("user-agent") ?? "").trim().toLowerCase();

  const ipBlocked = BLOCKED_CIDRS.some((cidr) => isIpInCidr(ip, cidr));
  const uaBlocked = SUSPICIOUS_USER_AGENTS.has(ua);

  if (ipBlocked || uaBlocked) {
    res.status(403).json({ success: false, message: "Forbidden", data: null });
    return;
  }

  next();
}
