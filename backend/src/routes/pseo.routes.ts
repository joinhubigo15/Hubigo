import { Router } from "express";
import { getSitemapEntries, getResolveSearch } from "../controllers/pseo.controller";

const pseoRouter = Router();
pseoRouter.get("/sitemap-entries", getSitemapEntries);
pseoRouter.get("/resolve-search", getResolveSearch);

export { pseoRouter };
