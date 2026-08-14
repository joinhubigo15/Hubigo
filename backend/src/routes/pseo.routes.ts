import { Router } from "express";
import { getSitemapEntries } from "../controllers/pseo.controller";

const pseoRouter = Router();
pseoRouter.get("/sitemap-entries", getSitemapEntries);

export { pseoRouter };
