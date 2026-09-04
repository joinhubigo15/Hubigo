import { initSentry } from "./lib/sentry";
initSentry();

import app from "./app";
import { env, googleOAuthEnabled, emailEnabled } from "./config/env";

import { prisma } from "./lib/prisma";

async function purgeNonHealthcareFromDatabaseOnBoot() {
  try {
    const nonMedicalKeywords = [
      "hotel", "restaurant", "resort", "cafe", "bakery", "saree", "textile", "jewell",
      "electronics", "auto", "motors", "travels", "cabs", "real estate", "furniture",
      "footwear", "tailor", "bar", "pub", "wine", "liquor", "supermarket", "grocery",
      "hair fixing", "hair weaving", "wig"
    ];

    const candidates = await prisma.business.findMany({
      where: { status: "approved", deletedAt: null },
      select: { id: true, name: true, slug: true }
    });

    const toDeleteIds = candidates
      .filter((b) => {
        const lowerName = b.name.toLowerCase();
        const lowerSlug = b.slug.toLowerCase();

        const isExplicitGarbage = lowerName === "karnataka" || lowerName === "narachi" || lowerName === "proposed sub centre" || lowerSlug.includes("karnataka") || lowerSlug.includes("narachi");
        const matchesNonMedical = nonMedicalKeywords.some((kw) => lowerName.includes(kw) || lowerSlug.includes(kw));

        if (!isExplicitGarbage && !matchesNonMedical) return false;

        const isGenuineMedical = lowerName.includes("hospital") || lowerName.includes("clinic") || lowerName.includes("lab") || lowerName.includes("pharmacy") || lowerName.includes("doctor") || lowerName.includes("patholog") || lowerName.includes("dental") || lowerName.includes("physio");
        return !isGenuineMedical;
      })
      .map((b) => b.id);

    if (toDeleteIds.length > 0) {
      const res = await prisma.business.updateMany({
        where: { id: { in: toDeleteIds } },
        data: { deletedAt: new Date(), status: "rejected" }
      });
      console.log(`🧹 [Boot Purge] Successfully soft-deleted ${res.count} non-healthcare listings from Railway PostgreSQL.`);
    }
  } catch (err: any) {
    console.warn("⚠️ [Boot Purge] Error during non-healthcare purge:", err.message);
  }
}

app.listen(env.PORT, () => {
  console.log(`Hubigo backend listening on http://localhost:${env.PORT}`);
  console.log(`  Google OAuth: ${googleOAuthEnabled ? "enabled" : "disabled (missing credentials)"}`);
  console.log(`  Email delivery: ${emailEnabled ? "enabled (Resend)" : "disabled (logging to console)"}`);
  purgeNonHealthcareFromDatabaseOnBoot().catch(console.error);
});
