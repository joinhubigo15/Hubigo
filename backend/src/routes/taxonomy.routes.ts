import { Router } from "express";
import {
  getCategories,
  getCities,
  getLocalities,
  getArea,
  getAmenities,
  getGeocodeLocal,
  getStats,
  getOffers,
  getPopular,
} from "../controllers/taxonomy.controller";

const categoriesRouter = Router();
categoriesRouter.get("/", getCategories);

const citiesRouter = Router();
// Must be registered before "/:citySlug/localities" so "geocode" doesn't get captured as a slug.
citiesRouter.get("/geocode", getGeocodeLocal);
citiesRouter.get("/", getCities);
citiesRouter.get("/:citySlug/localities", getLocalities);
citiesRouter.get("/:citySlug/areas/:areaSlug", getArea);

const amenitiesRouter = Router();
amenitiesRouter.get("/", getAmenities);

const statsRouter = Router();
statsRouter.get("/", getStats);

const offersRouter = Router();
offersRouter.get("/", getOffers);

const popularRouter = Router();
popularRouter.get("/", getPopular);

export { categoriesRouter, citiesRouter, amenitiesRouter, statsRouter, offersRouter, popularRouter };
