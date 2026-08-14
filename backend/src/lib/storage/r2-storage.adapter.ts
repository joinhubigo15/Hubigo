import fs from "node:fs";
import { DeleteObjectCommand, HeadObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import { getR2Client } from "./r2-client";
import { env } from "../../config/env";
import type { ImageBucket, ImageStorageAdapter, UploadOutcome } from "./image-storage.interface";

const MIME_BY_EXT: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

const BUCKET_ENV_NAME: Record<ImageBucket, string> = {
  business: "R2_BUSINESS_BUCKET",
  badge: "R2_BADGE_BUCKET",
  docs: "R2_DOCS_BUCKET",
  avatars: "R2_PROFILE_PICS_BUCKET",
};

const BUCKET_NAME_BY_TYPE: Record<ImageBucket, string | undefined> = {
  business: env.R2_BUSINESS_BUCKET,
  badge: env.R2_BADGE_BUCKET,
  docs: env.R2_DOCS_BUCKET,
  avatars: env.R2_PROFILE_PICS_BUCKET,
};

function bucketName(bucket: ImageBucket): string {
  const name = BUCKET_NAME_BY_TYPE[bucket];
  if (!name) {
    throw new Error(`${BUCKET_ENV_NAME[bucket]} is not set in backend/.env`);
  }
  return name;
}

const BUCKET_URL_BY_TYPE: Record<ImageBucket, string | undefined> = {
  business: env.R2_BUSINESS_BUCKET_URL,
  badge: env.R2_BADGE_BUCKET_URL,
  docs: env.R2_DOCS_BUCKET_URL,
  avatars: env.R2_PROFILE_PICS_BUCKET_URL,
};

function guessContentType(key: string): string {
  const ext = key.slice(key.lastIndexOf(".")).toLowerCase();
  return MIME_BY_EXT[ext] ?? "application/octet-stream";
}

export class R2StorageAdapter implements ImageStorageAdapter {
  readonly name = "r2";

  async exists(bucket: ImageBucket, key: string): Promise<boolean> {
    const client = getR2Client();
    try {
      await client.send(new HeadObjectCommand({ Bucket: bucketName(bucket), Key: key }));
      return true;
    } catch (err) {
      const status = (err as { $metadata?: { httpStatusCode?: number } }).$metadata?.httpStatusCode;
      if (status === 404) return false;
      throw err;
    }
  }

  async uploadIfMissing(bucket: ImageBucket, key: string, localFilePath: string): Promise<UploadOutcome> {
    if (await this.exists(bucket, key)) {
      return { key, skipped: true };
    }

    const client = getR2Client();
    const body = fs.readFileSync(localFilePath);
    await client.send(
      new PutObjectCommand({
        Bucket: bucketName(bucket),
        Key: key,
        Body: body,
        ContentType: guessContentType(key),
      }),
    );
    return { key, skipped: false };
  }

  async uploadBuffer(bucket: ImageBucket, key: string, buffer: Buffer, contentType: string): Promise<{ key: string }> {
    const client = getR2Client();
    await client.send(
      new PutObjectCommand({ Bucket: bucketName(bucket), Key: key, Body: buffer, ContentType: contentType }),
    );
    return { key };
  }

  async delete(bucket: ImageBucket, key: string): Promise<void> {
    const client = getR2Client();
    await client.send(new DeleteObjectCommand({ Bucket: bucketName(bucket), Key: key }));
  }

  resolveUrl(bucket: ImageBucket, key: string): string | null {
    const base = BUCKET_URL_BY_TYPE[bucket];
    if (!base) return null;
    return `${base.replace(/\/$/, "")}/${key}`;
  }
}

let singleton: R2StorageAdapter | null = null;
export function getImageStorageAdapter(): ImageStorageAdapter {
  if (!singleton) singleton = new R2StorageAdapter();
  return singleton;
}
