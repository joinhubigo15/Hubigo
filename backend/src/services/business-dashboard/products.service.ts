import { prisma } from "../../lib/prisma";
import { ApiError } from "../../utils/ApiError";
import { resolveImageUrl } from "../../lib/storage/resolve-image-url";
import { uploadOwnerImage, deleteOwnerImageIfOwned } from "./profile.service";
import type { CreateProductInput, UpdateProductInput } from "../../schemas/business-dashboard.schema";

function withResolvedImage<T extends { imageUrl: string | null }>(p: T) {
  return { ...p, imageUrl: resolveImageUrl(p.imageUrl) };
}

export async function listProducts(businessId: string) {
  const products = await prisma.product.findMany({ where: { businessId }, orderBy: { sortOrder: "asc" } });
  return products.map(withResolvedImage);
}

export async function createProduct(businessId: string, input: CreateProductInput, file?: Express.Multer.File) {
  const maxSort = await prisma.product.aggregate({ where: { businessId }, _max: { sortOrder: true } });
  const imageUrl = file ? await uploadOwnerImage(businessId, file) : null;

  const product = await prisma.product.create({
    data: {
      businessId,
      name: input.name,
      description: input.description,
      price: input.price,
      category: input.category,
      isAvailable: input.isAvailable ?? true,
      imageUrl,
      sortOrder: (maxSort._max.sortOrder ?? -1) + 1,
    },
  });
  return withResolvedImage(product);
}

export async function updateProduct(businessId: string, productId: string, input: UpdateProductInput, file?: Express.Multer.File) {
  const existing = await prisma.product.findFirst({ where: { id: productId, businessId } });
  if (!existing) throw ApiError.notFound("Product not found");

  let imageUrl = existing.imageUrl;
  if (file) {
    imageUrl = await uploadOwnerImage(businessId, file);
    await deleteOwnerImageIfOwned(existing.imageUrl);
  }

  const product = await prisma.product.update({ where: { id: productId }, data: { ...input, imageUrl } });
  return withResolvedImage(product);
}

export async function deleteProduct(businessId: string, productId: string) {
  const existing = await prisma.product.findFirst({ where: { id: productId, businessId } });
  if (!existing) throw ApiError.notFound("Product not found");
  await deleteOwnerImageIfOwned(existing.imageUrl);
  await prisma.product.delete({ where: { id: productId } });
}
