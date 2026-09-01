import { Router } from "express";
import { getSitemapEntries, getResolveSearch, getBusinessSlugs } from "../controllers/pseo.controller";

const pseoRouter = Router();
pseoRouter.get("/sitemap-entries", getSitemapEntries);
pseoRouter.get("/resolve-search", getResolveSearch);
pseoRouter.get("/business-slugs", getBusinessSlugs);

export { pseoRouter };
