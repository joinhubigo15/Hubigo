import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { avatarUpload } from "../middleware/upload";
import {
  getMe,
  patchProfile,
  putAvatar,
  deleteAvatarHandler,
  postOnboarding,
  patchNotificationPreferences,
  getSavedBusinesses,
  postSavedBusiness,
  deleteSavedBusiness,
  getSavedSearches,
  postSavedSearch,
  deleteSavedSearch,
  getNotifications,
  patchNotificationRead,
  patchAllNotificationsRead,
  deleteAllNotifications,
  postPushSubscription,
  deletePushSubscription,
  getMyClaims,
} from "../controllers/users.controller";
import { getMyBusiness, getMyBusinesses } from "../controllers/claims.controller";
import { getMyConversations, getMyConversationMessagesHandler, postMyReply, deleteMyConversationHandler } from "../controllers/business-dashboard/messages.controller";

const router = Router();

router.use(requireAuth);

router.get("/me", getMe);
router.patch("/me", patchProfile);
router.post("/me/onboarding", postOnboarding);
router.put("/me/avatar", avatarUpload, putAvatar);
router.delete("/me/avatar", deleteAvatarHandler);
router.patch("/me/notifications", patchNotificationPreferences);
router.get("/me/business", getMyBusiness);
router.get("/me/businesses", getMyBusinesses);

router.get("/me/saved-businesses", getSavedBusinesses);
router.post("/me/saved-businesses", postSavedBusiness);
router.delete("/me/saved-businesses/:id", deleteSavedBusiness);

router.get("/me/saved-searches", getSavedSearches);
router.post("/me/saved-searches", postSavedSearch);
router.delete("/me/saved-searches/:id", deleteSavedSearch);

router.get("/me/notifications", getNotifications);
router.patch("/me/notifications/read-all", patchAllNotificationsRead);
router.patch("/me/notifications/:id/read", patchNotificationRead);
router.delete("/me/notifications", deleteAllNotifications);

router.post("/me/push-subscriptions", postPushSubscription);
router.delete("/me/push-subscriptions", deletePushSubscription);

router.get("/me/claims", getMyClaims);

router.get("/me/conversations", getMyConversations);
router.get("/me/conversations/:conversationId", getMyConversationMessagesHandler);
router.post("/me/conversations/:conversationId/messages", postMyReply);
router.delete("/me/conversations/:conversationId", deleteMyConversationHandler);

export default router;
