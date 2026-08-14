import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { requireOwnedBusiness } from "../middleware/require-owned-business";
import { businessImageUpload, businessGalleryUpload } from "../middleware/upload";

import * as profile from "../controllers/business-dashboard/profile.controller";
import * as offers from "../controllers/business-dashboard/offers.controller";
import * as leads from "../controllers/business-dashboard/leads.controller";
import * as reviews from "../controllers/business-dashboard/reviews.controller";
import * as appointments from "../controllers/business-dashboard/appointments.controller";
import * as products from "../controllers/business-dashboard/products.controller";
import * as messages from "../controllers/business-dashboard/messages.controller";

const router = Router();

router.use(requireAuth, requireOwnedBusiness);

// Profile
router.get("/profile", profile.getProfile);
router.patch("/profile", profile.patchProfile);
router.put("/profile/hours", profile.putHours);
router.put("/profile/amenities", profile.putAmenities);
router.post("/profile/amenities/custom", profile.postCustomAmenity);
router.put("/profile/categories", profile.putCategories);
router.post("/profile/services", profile.postService);
router.patch("/profile/services/:serviceId", profile.patchService);
router.delete("/profile/services/:serviceId", profile.deleteServiceHandler);
router.put("/profile/logo", businessImageUpload, profile.putLogo);
router.put("/profile/cover", businessImageUpload, profile.putCover);
router.post("/profile/media", businessGalleryUpload, profile.postGalleryImages);
router.delete("/profile/media/:mediaId", profile.deleteGalleryImageHandler);

// Offers
router.get("/offers", offers.getOffers);
router.post("/offers", offers.postOffer);
router.patch("/offers/:offerId", offers.patchOffer);
router.delete("/offers/:offerId", offers.deleteOfferHandler);

// Leads
router.get("/leads", leads.getLeads);
router.patch("/leads/:leadId/status", leads.patchLeadStatus);

// Reviews
router.get("/reviews", reviews.getReviews);
router.post("/reviews/:reviewId/reply", reviews.postReviewReply);

// Appointments
router.get("/appointments", appointments.getAppointments);
router.post("/appointments", appointments.postAppointment);
router.patch("/appointments/:appointmentId", appointments.patchAppointment);
router.delete("/appointments/:appointmentId", appointments.deleteAppointmentHandler);

// Products
router.get("/products", products.getProducts);
router.post("/products", businessImageUpload, products.postProduct);
router.patch("/products/:productId", businessImageUpload, products.patchProduct);
router.delete("/products/:productId", products.deleteProductHandler);

// Messages (business side)
router.get("/conversations", messages.getConversations);
router.get("/conversations/:conversationId", messages.getConversationMessagesHandler);
router.post("/conversations/:conversationId/messages", messages.postReply);
router.delete("/conversations/:conversationId", messages.deleteConversationHandler);

export default router;
