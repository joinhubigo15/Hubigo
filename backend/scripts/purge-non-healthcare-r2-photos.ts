import { ListObjectsV2Command, DeleteObjectsCommand } from "@aws-sdk/client-s3";
import { getR2Client } from "../src/lib/storage/r2-client";
import dotenv from "dotenv";
import path from "path";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const HEALTHCARE_FOLDERS = new Set([
  "ambulance-service",
  "ayurvedic-clinic",
  "blood-testing-service",
  "cancer-care-center",
  "cardiology-clinic",
  "dental-clinic",
  "diagnostic-center",
  "doctor",
  "ent-clinic",
  "eye-care-clinic",
  "gastroenterology-clinic",
  "home-health-care-service",
  "hospital",
  "ivf-and-fertility-center",
  "lab-services",
  "maternity-hospital",
  "medical-equipment-supplier",
  "medical-store",
  "neurology-clinic",
  "nursing-home",
  "orthopedic-clinic",
  "pathology-lab",
  "pediatric-clinic",
  "pharmacy",
  "physiotherapy-clinic",
  "psychiatrist",
  "radiology-center",
  "skin-and-dermatology-clinic",
  "ultrasound-center",
  "urology-clinic",
  "veterinary-clinic",
]);

async function purgeNonHealthcareR2Photos() {
  console.log("==================================================");
  console.log("🧹 CLOUDFLARE R2 NON-HEALTHCARE PHOTO PURGE ENGINE (FAST DELIMITER)");
  console.log("==================================================");

  const client = getR2Client();
  const bucketName = process.env.R2_BUSINESS_BUCKET || "hubigo-business-images";

  console.log(`📡 Fetching top-level folders from R2 bucket "${bucketName}"...`);

  const listFolderCmd = new ListObjectsV2Command({
    Bucket: bucketName,
    Delimiter: "/",
  });
  const folderRes = await client.send(listFolderCmd);
  const allFolders = (folderRes.CommonPrefixes || [])
    .map((p) => p.Prefix?.replace(/\/$/, "").toLowerCase())
    .filter(Boolean) as string[];

  console.log(`📂 Found ${allFolders.length} total folders in R2 bucket.`);

  const nonHealthcareFolders = allFolders.filter((f) => !HEALTHCARE_FOLDERS.has(f));

  console.log(`❌ Non-Healthcare Folders to PURGE (${nonHealthcareFolders.length}):`, nonHealthcareFolders);
  console.log(`✅ Healthcare Folders to PRESERVE (${allFolders.length - nonHealthcareFolders.length})`);

  if (nonHealthcareFolders.length === 0) {
    console.log("✨ Cloudflare R2 bucket is already 100% clean! No non-healthcare folders found.");
    return;
  }

  let totalDeletedFiles = 0;

  for (const folder of nonHealthcareFolders) {
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;

    while (isTruncated) {
      const listCmd = new ListObjectsV2Command({
        Bucket: bucketName,
        Prefix: `${folder}/`,
        ContinuationToken: continuationToken,
      });
      const listRes = await client.send(listCmd);

      if (listRes.Contents && listRes.Contents.length > 0) {
        const keysToDelete = listRes.Contents.map((c) => ({ Key: c.Key! }));
        const deleteCmd = new DeleteObjectsCommand({
          Bucket: bucketName,
          Delete: { Objects: keysToDelete, Quiet: true },
        });
        await client.send(deleteCmd);
        totalDeletedFiles += keysToDelete.length;
      }

      isTruncated = listRes.IsTruncated || false;
      continuationToken = listRes.NextContinuationToken;
    }

    console.log(`  Purged folder "${folder}" -> Total deleted: ${totalDeletedFiles}`);
  }

  console.log(`\n🎉 SUCCESS! Purged all ${totalDeletedFiles} non-healthcare photos across ${nonHealthcareFolders.length} non-healthcare folders from Cloudflare R2!`);
  console.log(`✨ Cloudflare R2 bucket now contains ONLY 100% Healthcare photos!`);
  console.log("==================================================\n");
}

purgeNonHealthcareR2Photos().catch(console.error);
