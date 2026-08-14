import { Router } from "express";
import { getNearbyBusinesses } from "../controllers/nearby.controller";

const router = Router();

router.get("/", getNearbyBusinesses);

export default router;
