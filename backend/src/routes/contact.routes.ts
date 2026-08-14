import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { postContactMessage } from "../controllers/contact.controller";

const router = Router();

router.use(requireAuth);
router.post("/", postContactMessage);

export default router;
