import { initSentry } from "./lib/sentry";
initSentry();

import app from "./app";
import { env, googleOAuthEnabled, emailEnabled } from "./config/env";

import { prisma } from "./lib/prisma";

async function restoreAndCleanHealthcareListings() {
  try {
    const healthcareCategorySlugs = [
      "hospitals", "diagnostic-labs", "doctors-clinics", "pharmacies",
      "dentists", "eye-care", "physiotherapy", "veterinary", "medical-equipment"
    ];

    // 1. Restore all businesses linked to healthcare categories to status='approved', deletedAt=null
    const restored = await prisma.business.updateMany({
      where: {
        categories: {
          some: {
            category: {
              OR: [
                { slug: { in: healthcareCategorySlugs } },
                { parentId: { not: null } }
              ]
            }
          }
        }
      },
      data: {
        status: "approved",
        deletedAt: null
      }
    });

    console.log(`✅ [Boot Restore] Successfully restored ${restored.count} Healthcare business listings to active approved status!`);

    // 2. Only soft-delete explicit non-healthcare garbage (hotel, restaurant, saree, etc.) if NOT in a healthcare category
    const nonMedicalKeywords = [
      "hotel", "restaurant", "resort", "cafe", "bakery", "saree", "textile", "jewell",
      "electronics", "auto", "motors", "travels", "cabs", "real estate", "furniture",
      "footwear", "tailor", "bar", "pub", "wine", "liquor", "supermarket", "grocery"
    ];

    const toPurge = await prisma.business.findMany({
      where: {
        status: "approved",
        deletedAt: null,
        categories: {
          none: {
            category: {
              slug: { in: healthcareCategorySlugs }
            }
          }
        }
      },
      select: { id: true, name: true, slug: true }
    });

    const purgeIds = toPurge
      .filter((b) => {
        const lowerName = b.name.toLowerCase();
        const lowerSlug = b.slug.toLowerCase();
        return nonMedicalKeywords.some((kw) => lowerName.includes(kw) || lowerSlug.includes(kw)) ||
               lowerName === "karnataka" || lowerName === "narachi";
      })
      .map((b) => b.id);

    if (purgeIds.length > 0) {
      await prisma.business.updateMany({
        where: { id: { in: purgeIds } },
        data: { deletedAt: new Date(), status: "rejected" }
      });
      console.log(`🧹 [Boot Purge] Soft-deleted ${purgeIds.length} non-healthcare listings.`);
    }
  } catch (err: any) {
    console.warn("⚠️ [Boot Restore/Purge Error]:", err.message);
  }
}

app.listen(env.PORT, () => {
  console.log(`Hubigo backend listening on http://localhost:${env.PORT}`);
  console.log(`  Google OAuth: ${googleOAuthEnabled ? "enabled" : "disabled (missing credentials)"}`);
  console.log(`  Email delivery: ${emailEnabled ? "enabled (Resend)" : "disabled (logging to console)"}`);
  restoreAndCleanHealthcareListings().catch(console.error);
});
