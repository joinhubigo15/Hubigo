import { Router } from "express";
import { getCompare, getCompareNearby, getBusinessBySlug, postBusinessInteraction, postBusinessReview, postCreateBusiness, postSuggestEdit, postReportListing } from "../controllers/businesses.controller";
import { postStartConversation } from "../controllers/business-dashboard/messages.controller";
import { requireAuth, optionalAuth } from "../middleware/auth";

const router = Router();

// Must be registered before "/:slug" so "compare"/":businessId/messages" don't get captured as
// a slug param.
router.get("/compare/nearby", getCompareNearby);
router.get("/compare", getCompare);
// Self-service listing creation — any logged-in account, not scoped to an existing business
// (that's the whole point). Business is live immediately; no admin moderation queue for v1.
router.post("/", requireAuth, postCreateBusiness);
// Consumer-facing "Message this business" entry point — any logged-in user, any business, not
// scoped to an owner. Lives here (not business-dashboard.routes.ts) since it's the read-only
// public-business namespace's one write action.
router.post("/:businessId/messages", requireAuth, postStartConversation);
// Reviews publish immediately (no admin moderation queue) — see reviews.service.ts.
router.post("/:businessId/reviews", requireAuth, postBusinessReview);
router.post("/:businessId/suggest-edit", optionalAuth, postSuggestEdit);
router.post("/:businessId/report", optionalAuth, postReportListing);
router.get("/:slug", optionalAuth, getBusinessBySlug);
// Explicit Call/WhatsApp click tracking (competitor-lead routing) — optionalAuth so anonymous
// clicks don't error, they just don't attribute a lead to anyone.
router.post("/:slug/interactions", optionalAuth, postBusinessInteraction);

export default router;
