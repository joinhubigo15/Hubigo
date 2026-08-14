import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { sendSuccess } from "../../utils/ApiResponse";
import { writeAdminAudit, adminAuditReqMeta } from "../../lib/admin-audit";
import {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listSubcategories,
  createSubcategory,
  updateSubcategory,
  deleteSubcategory,
} from "../../services/admin/taxonomy.service";
import {
  createCategorySchema,
  updateCategorySchema,
  createSubcategorySchema,
  updateSubcategorySchema,
} from "../../schemas/admin.schema";

export const getCategories = asyncHandler(async (_req: Request, res: Response) => {
  const categories = await listCategories();
  return sendSuccess(res, 200, "Categories", categories);
});

export const postCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = createCategorySchema.parse(req.body);
  const category = await createCategory(input);
  await writeAdminAudit(req.adminAuth!.id, "category_created", "Category", category.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 201, "Category created", category);
});

export const patchCategory = asyncHandler(async (req: Request, res: Response) => {
  const input = updateCategorySchema.parse(req.body);
  const category = await updateCategory(req.params.id, input);
  await writeAdminAudit(req.adminAuth!.id, "category_updated", "Category", req.params.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 200, "Category updated", category);
});

export const deleteCategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteCategory(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "category_deleted", "Category", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Category deleted", { id: req.params.id });
});

export const getSubcategories = asyncHandler(async (_req: Request, res: Response) => {
  const subcategories = await listSubcategories();
  return sendSuccess(res, 200, "Subcategories", subcategories);
});

export const postSubcategory = asyncHandler(async (req: Request, res: Response) => {
  const input = createSubcategorySchema.parse(req.body);
  const subcategory = await createSubcategory(input);
  await writeAdminAudit(req.adminAuth!.id, "subcategory_created", "Category", subcategory.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 201, "Subcategory created", subcategory);
});

export const patchSubcategory = asyncHandler(async (req: Request, res: Response) => {
  const input = updateSubcategorySchema.parse(req.body);
  const subcategory = await updateSubcategory(req.params.id, input);
  await writeAdminAudit(req.adminAuth!.id, "subcategory_updated", "Category", req.params.id, adminAuditReqMeta(req), input);
  return sendSuccess(res, 200, "Subcategory updated", subcategory);
});

export const deleteSubcategoryHandler = asyncHandler(async (req: Request, res: Response) => {
  await deleteSubcategory(req.params.id);
  await writeAdminAudit(req.adminAuth!.id, "subcategory_deleted", "Category", req.params.id, adminAuditReqMeta(req));
  return sendSuccess(res, 200, "Subcategory deleted", { id: req.params.id });
});
