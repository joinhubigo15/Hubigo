import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { ApiError } from "../../utils/ApiError";
import * as profileService from "../../services/business-dashboard/profile.service";
import {
  updateBusinessProfileSchema,
  updateHoursSchema,
  updateAmenitiesSchema,
  createAmenitySchema,
  updateCategoriesSchema,
  serviceSchema,
} from "../../schemas/business-dashboard.schema";

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
  const profile = await profileService.getFullProfile(req.business!);
  return sendSuccess(res, 200, "Business profile", profile);
});

export const patchProfile = asyncHandler(async (req: Request, res: Response) => {
  const input = updateBusinessProfileSchema.parse(req.body);
  const updated = await profileService.updateProfile(req.business!.id, input);
  return sendSuccess(res, 200, "Profile updated", updated);
});

export const putHours = asyncHandler(async (req: Request, res: Response) => {
  const input = updateHoursSchema.parse(req.body);
  const hours = await profileService.replaceHours(req.business!.id, input);
  return sendSuccess(res, 200, "Business hours updated", hours);
});

export const putAmenities = asyncHandler(async (req: Request, res: Response) => {
  const input = updateAmenitiesSchema.parse(req.body);
  const amenities = await profileService.replaceAmenities(req.business!.id, input);
  return sendSuccess(res, 200, "Amenities updated", amenities);
});

export const postCustomAmenity = asyncHandler(async (req: Request, res: Response) => {
  const input = createAmenitySchema.parse(req.body);
  const amenity = await profileService.createCustomAmenity(req.business!.id, input.name);
  return sendSuccess(res, 201, "Amenity added", amenity);
});

export const putCategories = asyncHandler(async (req: Request, res: Response) => {
  const input = updateCategoriesSchema.parse(req.body);
  const categories = await profileService.replaceCategories(req.business!.id, input);
  return sendSuccess(res, 200, "Categories updated", categories);
});

export const postService = asyncHandler(async (req: Request, res: Response) => {
  const input = serviceSchema.parse(req.body);
  const service = await profileService.addService(req.business!.id, input);
  return sendSuccess(res, 201, "Service added", service);
});

export const patchService = asyncHandler(async (req: Request, res: Response) => {
  const input = serviceSchema.parse(req.body);
  const service = await profileService.updateService(req.business!.id, req.params.serviceId, input);
  return sendSuccess(res, 200, "Service updated", service);
});

export const deleteServiceHandler = asyncHandler(async (req: Request, res: Response) => {
  await profileService.deleteService(req.business!.id, req.params.serviceId);
  return sendSuccess(res, 200, "Service removed", null);
});

export const putLogo = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No image file was uploaded");
  const logoUrl = await profileService.setLogo(req.business!, req.file);
  return sendSuccess(res, 200, "Logo updated", { logoUrl });
});

export const putCover = asyncHandler(async (req: Request, res: Response) => {
  if (!req.file) throw ApiError.badRequest("No image file was uploaded");
  const coverImageUrl = await profileService.setCover(req.business!, req.file);
  return sendSuccess(res, 200, "Cover image updated", { coverImageUrl });
});

export const postGalleryImages = asyncHandler(async (req: Request, res: Response) => {
  const files = (req.files as Express.Multer.File[] | undefined) ?? [];
  if (files.length === 0) throw ApiError.badRequest("No image files were uploaded");
  const media = await profileService.addGalleryImages(req.business!, files);
  return sendSuccess(res, 201, "Gallery images added", media);
});

export const deleteGalleryImageHandler = asyncHandler(async (req: Request, res: Response) => {
  await profileService.deleteGalleryImage(req.business!.id, req.params.mediaId);
  return sendSuccess(res, 200, "Image removed", null);
});
