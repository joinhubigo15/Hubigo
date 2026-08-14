import { Router, Request, Response } from "express";
import type { User } from "@prisma/client";
import passport from "../lib/passport";
import { issueSession, toPublicUser } from "../services/auth.service";
import { setRefreshCookie } from "../utils/cookies";
import { env, googleOAuthEnabled } from "../config/env";
import {
  logout,
  refresh,
  verifyEmailHandler,
  resendVerification,
} from "../controllers/auth.controller";
import { emailActionRateLimiter } from "../middleware/rateLimit";

const router = Router();

router.post("/logout", logout);
router.post("/refresh", refresh);
router.post("/verify-email", verifyEmailHandler);
router.post("/resend-verification", emailActionRateLimiter, resendVerification);

if (googleOAuthEnabled) {
  router.get(
    "/google",
    (req: Request, res: Response, next: any) => {
      const requestedRole = req.query.role === "business" || req.query.role === "business_owner" ? "business_owner" : "user";
      passport.authenticate("google", {
        scope: ["profile", "email"],
        session: false,
        state: JSON.stringify({ role: requestedRole }),
      })(req, res, next);
    }
  );

  router.get(
    "/google/callback",
    (req: Request, res: Response, next: any) => {
      // A custom callback (rather than a static `failureRedirect`) so a suspended-account failure
      // can redirect to its own error code — `failureRedirect` alone can't vary the destination
      // based on *why* authentication failed, only whether it did.
      passport.authenticate("google", { session: false }, async (err: Error | null, user: User | false, info?: { message?: string }) => {
        if (err) return next(err);
        if (!user) {
          const errorCode = info?.message === "account_suspended" ? "account_suspended" : "google_auth_failed";
          return res.redirect(`${env.FRONTEND_URL}/login?error=${errorCode}`);
        }

        try {
          const { accessToken, refreshToken } = await issueSession(user);
          setRefreshCookie(res, refreshToken);
          const publicUser = encodeURIComponent(JSON.stringify(toPublicUser(user)));

          // Reflects which login tab the person actually clicked (User vs Business), independent
          // of the account's stored role — a business_owner account picking "User Login" should
          // land on the customer homepage, not be force-redirected into the business dashboard
          // just because it also happens to own a business. Falls back to "user" if state is
          // missing/malformed.
          let requestedRole: "user" | "business_owner" = "user";
          try {
            const stateObj = JSON.parse((req.query.state as string) ?? "{}");
            if (stateObj.role === "business_owner") requestedRole = "business_owner";
          } catch {
            // ignore malformed state, default to "user"
          }

          res.redirect(
            `${env.FRONTEND_URL}/oauth/callback#accessToken=${accessToken}&user=${publicUser}&intent=${requestedRole}`
          );
        } catch (sessionErr) {
          next(sessionErr);
        }
      })(req, res, next);
    }
  );
} else {
  router.get("/google", (_req: Request, res: Response) => {
    res.status(503).json({
      success: false,
      message: "Google sign-in is not configured on this server yet",
      data: null,
      error: { code: "OAUTH_NOT_CONFIGURED" },
    });
  });
}

export default router;
