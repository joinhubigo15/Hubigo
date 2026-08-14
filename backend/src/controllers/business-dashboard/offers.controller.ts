import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as offersService from "../../services/business-dashboard/offers.service";
import { offerSchema } from "../../schemas/business-dashboard.schema";

export const getOffers = asyncHandler(async (req: Request, res: Response) => {
  const offers = await offersService.listOffers(req.business!.id);
  return sendSuccess(res, 200, "Offers", offers);
});

export const postOffer = asyncHandler(async (req: Request, res: Response) => {
  const input = offerSchema.parse(req.body);
  const offer = await offersService.createOffer(req.business!.id, input);
  return sendSuccess(res, 201, "Offer created", offer);
});

export const patchOffer = asyncHandler(async (req: Request, res: Response) => {
  const input = offerSchema.partial().parse(req.body);
  const offer = await offersService.updateOffer(req.business!.id, req.params.offerId, input);
  return sendSuccess(res, 200, "Offer updated", offer);
});

export const deleteOfferHandler = asyncHandler(async (req: Request, res: Response) => {
  await offersService.deleteOffer(req.business!.id, req.params.offerId);
  return sendSuccess(res, 200, "Offer removed", null);
});
