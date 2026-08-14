import { Router } from "express";
import { requireAdminAuth } from "../middleware/admin-auth";
import { csvImportUpload } from "../middleware/upload";
import { getAllClaims, postApproveClaim, postRejectClaim } from "../controllers/admin.controller";
import { getMetrics } from "../controllers/admin/dashboard.controller";
import {
  getBusinesses,
  postVerifyBusiness,
  postUnverifyBusiness,
  patchBusinessStatus,
  deleteBusinessHandler,
} from "../controllers/admin/businesses.controller";
import { getUsers, postSuspendUser, postActivateUser } from "../controllers/admin/users.controller";
import { getReviews, postApproveReview, postFlagReview, postSpamReview, deleteReviewHandler } from "../controllers/admin/reviews.controller";
import { getLeads, deleteLeadHandler } from "../controllers/admin/leads.controller";
import { getContactMessages, postMarkContactMessageRead, deleteContactMessageHandler } from "../controllers/admin/contact-messages.controller";
import {
  getEditSuggestions,
  postResolveEditSuggestion,
  deleteEditSuggestionHandler,
  getListingReports,
  postResolveListingReport,
  deleteListingReportHandler,
} from "../controllers/admin/listing-feedback.controller";
import { postImportJob, getImportJobs, postRetryImportJob } from "../controllers/admin/imports.controller";
import {
  getCategories,
  postCategory,
  patchCategory,
  deleteCategoryHandler,
  getSubcategories,
  postSubcategory,
  patchSubcategory,
  deleteSubcategoryHandler,
} from "../controllers/admin/taxonomy.controller";
import {
  getCities,
  postCity,
  patchCity,
  postAcknowledgeCity,
  deleteCityHandler,
  getAreas,
  postArea,
  patchArea,
  deleteAreaHandler,
} from "../controllers/admin/geo.controller";
import { getAuditLogs } from "../controllers/admin/audit-logs.controller";
import { getTeam, postTeamMember, patchTeamMember, deleteTeamMember } from "../controllers/admin/team.controller";
import { getRoles, postRole, patchRole, deleteRole } from "../controllers/admin/roles.controller";
import { getSettings } from "../controllers/admin/settings.controller";
import { getAnalyticsHandler } from "../controllers/admin/analytics.controller";

const router = Router();

// Business claim/verification moderation is an internal-operations action, gated by the
// AdminUser/AdminSession console auth (same as everything under /admin/*) — NOT the consumer
// User.role "admin"/"super_admin" enum values, which nothing in the app ever actually assigns.
// These endpoints were previously unreachable as a result. Consumer/business-owner auth is
// untouched by this change.
router.use(requireAdminAuth);

router.get("/claims", getAllClaims);
router.post("/claims/:claimId/approve", postApproveClaim);
router.post("/claims/:claimId/reject", postRejectClaim);

// ── Dashboard ────────────────────────────────────────────────────────────────
router.get("/dashboard/metrics", getMetrics);

// ── Businesses ───────────────────────────────────────────────────────────────
router.get("/businesses", getBusinesses);
router.post("/businesses/:id/verify", postVerifyBusiness);
router.post("/businesses/:id/unverify", postUnverifyBusiness);
router.patch("/businesses/:id/status", patchBusinessStatus);
router.delete("/businesses/:id", deleteBusinessHandler);

// ── Users ────────────────────────────────────────────────────────────────────
router.get("/users", getUsers);
router.post("/users/:id/suspend", postSuspendUser);
router.post("/users/:id/activate", postActivateUser);

// ── Reviews ──────────────────────────────────────────────────────────────────
router.get("/reviews", getReviews);
router.post("/reviews/:id/approve", postApproveReview);
router.post("/reviews/:id/flag", postFlagReview);
router.post("/reviews/:id/spam", postSpamReview);
router.delete("/reviews/:id", deleteReviewHandler);

// ── Leads ──────────────────────────────────────────────────────────────────
router.get("/leads", getLeads);
router.delete("/leads/:id", deleteLeadHandler);

// ── Contact Messages (site-wide /contact form submissions) ───────────────────
router.get("/contact-messages", getContactMessages);
router.post("/contact-messages/:id/read", postMarkContactMessageRead);
router.delete("/contact-messages/:id", deleteContactMessageHandler);

// ── Listing Feedback (customer "Suggest an Edit" / "Report Listing" from a business page) ────
router.get("/edit-suggestions", getEditSuggestions);
router.post("/edit-suggestions/:id/resolve", postResolveEditSuggestion);
router.delete("/edit-suggestions/:id", deleteEditSuggestionHandler);
router.get("/listing-reports", getListingReports);
router.post("/listing-reports/:id/resolve", postResolveListingReport);
router.delete("/listing-reports/:id", deleteListingReportHandler);

// ── Imports (ImportJob) ──────────────────────────────────────────────────────
router.post("/imports", csvImportUpload, postImportJob);
router.get("/imports", getImportJobs);
router.post("/imports/:id/retry", postRetryImportJob);

// ── Taxonomy: categories / subcategories ─────────────────────────────────────
router.get("/categories", getCategories);
router.post("/categories", postCategory);
router.patch("/categories/:id", patchCategory);
router.delete("/categories/:id", deleteCategoryHandler);

router.get("/subcategories", getSubcategories);
router.post("/subcategories", postSubcategory);
router.patch("/subcategories/:id", patchSubcategory);
router.delete("/subcategories/:id", deleteSubcategoryHandler);

// ── Geo: cities / areas ───────────────────────────────────────────────────────
router.get("/cities", getCities);
router.post("/cities", postCity);
router.patch("/cities/:id", patchCity);
router.post("/cities/:id/acknowledge", postAcknowledgeCity);
router.delete("/cities/:id", deleteCityHandler);

router.get("/areas", getAreas);
router.post("/areas", postArea);
router.patch("/areas/:id", patchArea);
router.delete("/areas/:id", deleteAreaHandler);

// ── Audit logs ───────────────────────────────────────────────────────────────
router.get("/audit-logs", getAuditLogs);

// ── Admin team ───────────────────────────────────────────────────────────────
router.get("/team", getTeam);
router.post("/team", postTeamMember);
router.patch("/team/:id", patchTeamMember);
router.delete("/team/:id", deleteTeamMember);

// ── Roles ────────────────────────────────────────────────────────────────────
router.get("/roles", getRoles);
router.post("/roles", postRole);
router.patch("/roles/:id", patchRole);
router.delete("/roles/:id", deleteRole);

// ── Settings (read-only) ─────────────────────────────────────────────────────
router.get("/settings", getSettings);

// ── Analytics ────────────────────────────────────────────────────────────────
router.get("/analytics", getAnalyticsHandler);

export default router;
