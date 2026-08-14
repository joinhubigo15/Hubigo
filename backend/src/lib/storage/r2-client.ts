import { S3Client } from "@aws-sdk/client-s3";
import { env, r2Enabled } from "../../config/env";

let client: S3Client | null = null;

/** Lazily-constructed singleton S3 client pointed at the Cloudflare R2 account endpoint. */
export function getR2Client(): S3Client {
  if (!r2Enabled) {
    throw new Error(
      "Cloudflare R2 is not configured — set R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY and R2_ENDPOINT in backend/.env",
    );
  }
  if (!client) {
    client = new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
    });
  }
  return client;
}
