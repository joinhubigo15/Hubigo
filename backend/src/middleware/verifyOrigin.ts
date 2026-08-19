import { NextFunction, Request, Response } from "express";
import { env, originVerificationEnabled } from "../config/env";

// Cloudflare's WAF/Bot Fight Mode only ever sees traffic that's routed through its proxy via DNS.
// Anyone who already knows (or finds) Railway's raw *.up.railway.app address can hit the backend
// directly and skip Cloudflare entirely — which is exactly what the scraper was doing (confirmed
// 2026-08-19: its requests showed up in Railway's own logs but never in Cloudflare's). A
// Cloudflare Transform Rule injects this header into every request it proxies; anything reaching
// the origin without the right value didn't come through Cloudflare and gets rejected.
export function verifyOrigin(req: Request, res: Response, next: NextFunction) {
  if (!originVerificationEnabled) {
    next();
    return;
  }

  if (req.get("x-origin-secret") !== env.CF_ORIGIN_SECRET) {
    res.status(403).json({ success: false, message: "Forbidden", data: null });
    return;
  }

  next();
}
