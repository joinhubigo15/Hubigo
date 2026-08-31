import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:yXJkwPJENxaoDmItvsqmtdNcmvQKpSQn@altaria.proxy.rlwy.net:31400/railway?connection_limit=20&pool_timeout=30";
const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

const CLEAN_HEALTHCARE_SLUGS = [
  "hospitals",
  "diagnostic-labs",
  "doctors-clinics",
  "pharmacies",
  "dentists",
  "eye-care",
  "physiotherapy",
  "veterinary",
  "medical-equipment",
];

async function purgeOldCategoriesFromPostgresql() {
  console.log(`====================================================`);
  console.log(`🧹 PURGING OLD NON-HEALTHCARE CATEGORIES FROM POSTGRESQL`);
  console.log(`====================================================`);

  try {
    const parentCats = await prisma.category.findMany({ where: { parentId: null } });
    console.log(`📊 Found ${parentCats.length} Parent Categories in Database.`);

    const oldParentIds = parentCats
      .filter((c) => !CLEAN_HEALTHCARE_SLUGS.includes(c.slug))
      .map((c) => c.id);

    if (oldParentIds.length > 0) {
      console.log(`🗑️ Deleting ${oldParentIds.length} old non-standard parent categories and subcategories...`);
      
      // Delete child subcategories of old parent categories
      await prisma.category.deleteMany({
        where: { parentId: { in: oldParentIds } },
      });

      // Delete old parent categories
      const deletedCount = await prisma.category.deleteMany({
        where: { id: { in: oldParentIds } },
      });

      console.log(`✅ Successfully deleted ${deletedCount.count} old parent categories!`);
    } else {
      console.log(`✅ Database already contains ONLY clean healthcare parent categories!`);
    }

    const remainingParents = await prisma.category.findMany({ where: { parentId: null } });
    console.log(`\n🎉 REMAINING PARENT CATEGORIES IN DATABASE:`);
    console.log(remainingParents.map((c) => `${c.name} (${c.slug})`));
    console.log(`====================================================\n`);
  } catch (err: any) {
    console.error(`❌ Error purging old categories:`, err.message || err);
  } finally {
    await prisma.$disconnect();
  }
}

purgeOldCategoriesFromPostgresql();
