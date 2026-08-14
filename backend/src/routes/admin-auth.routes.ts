import { Router } from "express";
import { requireAdminAuth } from "../middleware/admin-auth";
import { authRateLimiter } from "../middleware/rateLimit";
import { adminLogin, adminLogout, adminMe } from "../controllers/admin-auth.controller";

const router = Router();

router.post("/login", authRateLimiter, adminLogin);
router.post("/logout", requireAdminAuth, adminLogout);
router.get("/me", requireAdminAuth, adminMe);

export default router;
