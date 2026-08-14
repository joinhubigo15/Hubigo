import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import * as productsService from "../../services/business-dashboard/products.service";
import { createProductSchema, updateProductSchema } from "../../schemas/business-dashboard.schema";

export const getProducts = asyncHandler(async (req: Request, res: Response) => {
  const products = await productsService.listProducts(req.business!.id);
  return sendSuccess(res, 200, "Products", products);
});

export const postProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = createProductSchema.parse(req.body);
  const product = await productsService.createProduct(req.business!.id, input, req.file);
  return sendSuccess(res, 201, "Product added", product);
});

export const patchProduct = asyncHandler(async (req: Request, res: Response) => {
  const input = updateProductSchema.parse(req.body);
  const product = await productsService.updateProduct(req.business!.id, req.params.productId, input, req.file);
  return sendSuccess(res, 200, "Product updated", product);
});

export const deleteProductHandler = asyncHandler(async (req: Request, res: Response) => {
  await productsService.deleteProduct(req.business!.id, req.params.productId);
  return sendSuccess(res, 200, "Product removed", null);
});
