import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { writeAdminAudit, adminAuditReqMeta } from "../../lib/admin-audit";
import {
  listCities,
  createCity,
  updateCity,
  deleteCity,
  acknowledgeAutoCreatedCity,
  listAreas,
  createArea,
  updateArea,
  deleteArea,
} from "../../services/admin/geo.service";
import { createCitySchema, updateCitySchema, listAreasQuerySchema, createAreaSchema, updateAreaSchema } from "../../schemas/admin.schema";

export const getCities = asyncHandler(async (_req: Request, res: Response) => {
  const cities = await listCities();
  return sendSuccess(res, 200, "Cities", cities);
});

export const postCity = asyncHandler(async (req: Request, res: Response) => {
  const input = createCitySchema.parse(req.body);
  const city = await createCity(input);
  await writeAdminAudit(req.adminAuth!.id, "city_created", "City", city.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 201, "City created", city);
});

export const patchCity = asyncHandler(async (req: Request, res: Response) => {
  const input = updateCitySchema.parse(req.body);
  const city = await updateCity(req.params.id, input);
  await writeAdminAudit(req.adminAuth!.id, "city_updated", "City", req.params.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 200, "City updated", city);
});

export const postAcknowledgeCity = asyncHandler(async (req: Request, res: Response) => {
  const city = await acknowledgeAutoCreatedCity(req.params.id);
  return sendSuccess(res, 200, "Acknowledged", city);
});

export const deleteCityHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteCity(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "city_deleted", "City", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "City deleted", { id: req.params.id });
});

export const getAreas = asyncHandler(async (req: Request, res: Response) => {
  const { cityId } = listAreasQuerySchema.parse(req.query);
  const areas = await listAreas(cityId);
  return sendSuccess(res, 200, "Areas", areas);
});

export const postArea = asyncHandler(async (req: Request, res: Response) => {
  const input = createAreaSchema.parse(req.body);
  const area = await createArea(input);
  await writeAdminAudit(req.adminAuth!.id, "area_created", "Locality", area.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 201, "Area created", area);
});

export const patchArea = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAreaSchema.parse(req.body);
  const area = await updateArea(req.params.id, input);
  await writeAdminAudit(req.adminAuth!.id, "area_updated", "Locality", req.params.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 200, "Area updated", area);
});

export const deleteAreaHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteArea(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "area_deleted", "Locality", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Area deleted", { id: req.params.id });
});
