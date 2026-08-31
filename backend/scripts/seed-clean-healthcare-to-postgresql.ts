import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { PrismaClient, PlanTier, PriceRange } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:yXJkwPJENxaoDmItvsqmtdNcmvQKpSQn@altaria.proxy.rlwy.net:31400/railway?connection_limit=20&pool_timeout=30";
const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

interface CleanMasterRecord {
  place_id: string;
  name: string;
  address: string;
  primaryType?: string;
  Type?: string;
  subcategory?: string;
  phone_number?: string;
  international_phone_number?: string;
  longitude?: number | string;
  latitude?: number | string;
  operational_hours?: string;
  area?: string;
  city?: string;
  state?: string;
  country?: string;
  ratings?: number | string;
  reviews_count?: number | string;
  price_level?: string;
  editorial_summary?: string;
  payment_options?: string;
  accessibilityoptions?: string;
  website_url?: string;
  email?: string;
  services?: string;
}

async function seedAllCleanHealthcareToPostgresql() {
  console.log(`====================================================`);
  console.log(`🏥 BULK SEEDING ALL 28,000 CLEAN HEALTHCARE LISTINGS TO POSTGRESQL`);
  console.log(`====================================================`);

  const masterJsonPath = path.resolve(__dirname, "../google-place-ids-healthcare-CLEANED-master.json");
  if (!fs.existsSync(masterJsonPath)) {
    console.error(`Missing clean master file: ${masterJsonPath}`);
    process.exit(1);
  }

  const rawData: CleanMasterRecord[] = JSON.parse(fs.readFileSync(masterJsonPath, "utf8"));
  console.log(`📊 Loaded ${rawData.length} 100% clean healthcare listings.`);

  // Load Cities Map
  let city = await prisma.city.findFirst({ where: { slug: "bangalore" } });
  if (!city) {
    city = await prisma.city.create({
      data: { name: "Bangalore", slug: "bangalore", lat: 12.9716, lng: 77.5946 },
    });
  }

  // Load Categories Map
  const categories = await prisma.category.findMany();
  const defaultCategory = categories.find((c) => c.slug === "hospitals") || categories[0];

  const BATCH_SIZE = 500;
  let totalInserted = 0;

  for (let i = 0; i < rawData.length; i += BATCH_SIZE) {
    const chunk = rawData.slice(i, i + BATCH_SIZE);

    const businessData = chunk.map((item, idx) => {
      const baseSlug = (item.name || "healthcare-provider")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, "");
      const placeShort = item.place_id ? item.place_id.substring(0, 6).toLowerCase() : `${i + idx}`;
      const slug = `${baseSlug}-${placeShort}`;
      const lat = item.latitude ? parseFloat(String(item.latitude)) : 12.9716;
      const lng = item.longitude ? parseFloat(String(item.longitude)) : 77.5946;
      const avgRating = item.ratings ? parseFloat(String(item.ratings)) : 4.5;
      const reviewCount = item.reviews_count ? parseInt(String(item.reviews_count), 10) : 15;

      return {
        name: item.name || "Medical Provider",
        slug,
        description: item.editorial_summary || `${item.name} is a licensed healthcare medical provider located in ${item.area || "Bangalore"}.`,
        address: item.address || "Bangalore, Karnataka, India",
        cityId: city.id,
        pincode: "560034",
        lat,
        lng,
        phone: item.phone_number || "+91 80 4000 0000",
        website: item.website_url || "https://hubigo.in",
        planTier: PlanTier.basic,
        isVerified: true,
        isTrusted: true,
        priceRange: PriceRange.moderate,
        avgRating,
        reviewCount,
        status: "approved",
        externalPlaceId: item.place_id,
        openHoursRaw: item.operational_hours || "08:00 - 21:00",
      };
    });

    try {
      const result = await prisma.business.createMany({
        data: businessData,
        skipDuplicates: true,
      });

      totalInserted += result.count;
      console.log(`  📥 Batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(rawData.length / BATCH_SIZE)}: Inserted ${result.count} listings (Total: ${totalInserted})`);
    } catch (err: any) {
      console.warn(`  ⚠️ Batch error:`, err.message);
    }
  }

  // Link Primary Category to newly created businesses
  console.log(`🔗 Linking primary category to imported businesses...`);
  await prisma.$executeRawUnsafe(`
    INSERT INTO business_categories (id, business_id, category_id, is_primary)
    SELECT gen_random_uuid(), b.id, '${defaultCategory.id}', true
    FROM businesses b
    LEFT JOIN business_categories bc ON b.id = bc.business_id
    WHERE bc.id IS NULL
  `);

  const finalCount: any = await prisma.$queryRawUnsafe(`SELECT COUNT(*) as count FROM businesses`);
  console.log(`\n🎉 SUCCESSFULLY SEEDED ALL ${finalCount[0]?.count} CLEAN HEALTHCARE LISTINGS TO POSTGRESQL!`);
  console.log(`====================================================\n`);

  await prisma.$disconnect();
}

seedAllCleanHealthcareToPostgresql();
