import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { env, r2DocsEnabled, r2AvatarsEnabled } from "../config/env";
import { getImageStorageAdapter } from "./storage/r2-storage.adapter";

export const AVATAR_UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads", "avatars");
export const CLAIM_DOCUMENT_UPLOAD_DIR = path.join(__dirname, "..", "..", "public", "uploads", "claim-documents");

export interface UploadResult {
  url: string;
  publicId?: string;
}

const EXTENSION_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "application/pdf": "pdf",
};

export async function uploadAvatar(
  buffer: Buffer,
  mimeType: string,
  userId: string
): Promise<UploadResult> {
  const ext = EXTENSION_BY_MIME[mimeType] ?? "jpg";

  // R2 is preferred — persists across a Railway redeploy, unlike local disk. Falls through to
  // local disk on failure rather than hard-failing the profile update.
  if (r2AvatarsEnabled) {
    try {
      const key = `${userId}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
      const adapter = getImageStorageAdapter();
      await adapter.uploadBuffer("avatars", key, buffer, mimeType);
      const url = adapter.resolveUrl("avatars", key);
      if (url) return { url };
    } catch (err) {
      console.error("R2 avatar upload failed, falling back:", (err as Error).message);
    }
  }

  await fs.mkdir(AVATAR_UPLOAD_DIR, { recursive: true });
  const filename = `${userId}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await fs.writeFile(path.join(AVATAR_UPLOAD_DIR, filename), buffer);
  return { url: `${env.BACKEND_URL}/uploads/avatars/${filename}` };
}

export async function uploadClaimDocument(
  buffer: Buffer,
  mimeType: string,
  businessId: string
): Promise<UploadResult> {
  const ext = EXTENSION_BY_MIME[mimeType] ?? "pdf";

  // R2 is preferred — same object-storage account already used for business/badge images, and
  // (unlike local disk) actually persists across a Railway redeploy. Falls through to local disk
  // on failure (e.g. the R2 API token not yet being scoped to the docs bucket) rather than
  // hard-failing the claim submission.
  if (r2DocsEnabled) {
    try {
      const key = `${businessId}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
      const adapter = getImageStorageAdapter();
      await adapter.uploadBuffer("docs", key, buffer, mimeType);
      const url = adapter.resolveUrl("docs", key);
      if (url) return { url };
    } catch (err) {
      console.error("R2 claim-document upload failed, falling back:", (err as Error).message);
    }
  }

  await fs.mkdir(CLAIM_DOCUMENT_UPLOAD_DIR, { recursive: true });
  const filename = `${businessId}-${crypto.randomBytes(6).toString("hex")}.${ext}`;
  await fs.writeFile(path.join(CLAIM_DOCUMENT_UPLOAD_DIR, filename), buffer);
  return { url: `${env.BACKEND_URL}/uploads/claim-documents/${filename}` };
}

// `publicId` is no longer used (it was Cloudinary's asset identifier) but stays in the signature
// since callers still pass the stored value through — a no-op for R2/local-disk avatars.
export async function deleteAvatar(url: string, _publicId?: string | null) {
  if (r2AvatarsEnabled && env.R2_PROFILE_PICS_BUCKET_URL && url.startsWith(env.R2_PROFILE_PICS_BUCKET_URL)) {
    const key = url.slice(env.R2_PROFILE_PICS_BUCKET_URL.length).replace(/^\//, "");
    await getImageStorageAdapter().delete("avatars", key).catch(() => {});
    return;
  }

  const filename = url.split("/uploads/avatars/")[1];
  if (!filename) return;
  await fs.unlink(path.join(AVATAR_UPLOAD_DIR, filename)).catch(() => {});
}
