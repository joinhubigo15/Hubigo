import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { sensitiveActionRateLimiter } from "../middleware/rateLimit";
import { claimDocumentUpload } from "../middleware/upload";
import { postClaimDocument, getClaimStatusHandler } from "../controllers/claims.controller";

const router = Router();

// requireAuth is applied per-route (not via router.use) because this router shares the
// "/api/v1/businesses" mount prefix with businessesRoutes' public "/:slug" and "/compare"
// endpoints — an unconditional router.use(requireAuth) here would run for every request under
// that prefix (Express matches app.use() by path prefix, not by which router ends up handling
// it), which would incorrectly 401 the public business-detail page for anonymous visitors.

// STEP 1 — mandatory ownership verification via business proof document, reviewed by an admin.
router.post(
  "/:businessId/claim/document",
  requireAuth,
  sensitiveActionRateLimiter,
  claimDocumentUpload,
  postClaimDocument
);
router.get("/:businessId/claim/status", requireAuth, getClaimStatusHandler);

export default router;
