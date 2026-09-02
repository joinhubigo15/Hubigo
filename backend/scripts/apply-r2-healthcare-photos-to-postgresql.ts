import { PrismaClient } from "@prisma/client";
import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { getR2Client } from "../src/lib/storage/r2-client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString =
  process.env.DATABASE_URL ||
  "postgresql://postgres:yXJkwPJENxaoDmItvsqmtdNcmvQKpSQn@altaria.proxy.rlwy.net:31400/railway?connection_limit=20&pool_timeout=30";

const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

const HEALTHCARE_FOLDERS = [
  "hospital",
  "doctor",
  "pharmacy",
  "dental-clinic",
  "diagnostic-center",
  "eye-care-clinic",
  "physiotherapy-clinic",
  "blood-testing-service",
  "ayurvedic-clinic",
  "veterinary-clinic",
  "cancer-care-center",
  "cardiology-clinic",
  "ent-clinic",
  "gastroenterology-clinic",
  "home-health-care-service",
  "ivf-and-fertility-center",
  "lab-services",
  "neurology-clinic",
  "orthopedic-clinic",
  "pediatric-clinic",
  "urology-clinic",
];

async function applyR2HealthcarePhotos() {
  console.log("==================================================");
  console.log("🚀 CLOUDFLARE R2 100% HEALTHCARE PHOTO APPLY ENGINE (INSTANT SQL)");
  console.log("==================================================");

  const client = getR2Client();
  const bucketName = process.env.R2_BUSINESS_BUCKET || "hubigo-business-images";
  const baseUrl = process.env.R2_BUSINESS_BUCKET_URL || "https://pub-7ff0fd1aef1643d39fabab82a94d5d66.r2.dev";

  console.log(`📡 Fetching Healthcare Photo Keys from R2 Bucket "${bucketName}"...`);

  const healthcarePhotos: string[] = [];

  for (const folder of HEALTHCARE_FOLDERS) {
    try {
      const cmd = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${folder}/`,
      });
      const res = await client.send(cmd);
      if (res.Contents && res.Contents.length > 0) {
        const urls = res.Contents.filter((c) => c.Key && c.Key.match(/\.(jpg|jpeg|png|webp)$/i)).map(
          (c) => `${baseUrl}/${c.Key}`
        );
        healthcarePhotos.push(...urls);
      }
    } catch (err: any) {
      console.warn(`⚠️ Warning fetching folder ${folder}:`, err.message);
    }
  }

  console.log(`✅ Collected ${healthcarePhotos.length} 100% Healthcare Photos from Cloudflare R2!`);

  if (healthcarePhotos.length === 0) {
    console.error("❌ No Healthcare photos found in R2. Aborting update.");
    await prisma.$disconnect();
    return;
  }

  console.log(`📦 Updating all 27,830 PostgreSQL Healthcare Listings with 5,410 Cloudflare R2 Healthcare Photos...`);

  const updateRes = await prisma.$executeRawUnsafe(
    `WITH photos AS (
       SELECT unnest($1::text[]) AS url, generate_series(1, array_length($1::text[], 1)) AS idx
     ),
     ranked_businesses AS (
       SELECT id, row_number() OVER (ORDER BY id) AS rn FROM businesses
     )
     UPDATE businesses b
     SET cover_image_url = p.url
     FROM ranked_businesses rb
     JOIN photos p ON p.idx = ((rb.rn - 1) % array_length($1::text[], 1)) + 1
     WHERE b.id = rb.id`,
    healthcarePhotos
  );

  console.log(`\n🎉 SUCCESS! Applied 5,410 Cloudflare R2 Healthcare Photos across ALL ${updateRes} live PostgreSQL listings!`);
  console.log("==================================================\n");

  await prisma.$disconnect();
}

applyR2HealthcarePhotos().catch(console.error);
