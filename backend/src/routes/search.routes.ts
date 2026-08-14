import { Router } from "express";
import { getSearch, getSearchSuggestions, getSearchPopular } from "../controllers/search.controller";

const router = Router();

router.get("/", getSearch);
router.get("/suggestions", getSearchSuggestions);
router.get("/popular", getSearchPopular);

export default router;
