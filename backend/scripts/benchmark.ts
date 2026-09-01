import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:yXJkwPJENxaoDmItvsqmtdNcmvQKpSQn@altaria.proxy.rlwy.net:31400/railway?connection_limit=20&pool_timeout=30";
const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

async function benchmark() {
  const start1 = Date.now();
  await prisma.$queryRawUnsafe(`
    WITH primary_category AS (
      SELECT bc.business_id, c.name AS category_name, c.slug AS category_slug, c.parent_id AS category_parent_id
      FROM business_categories bc
      JOIN categories c ON c.id = bc.category_id
      WHERE bc.is_primary = true
    ),
    base_candidates AS (
      SELECT b.*, city.slug AS city_slug, city.name AS city_name,
        loc.slug AS locality_slug, loc.name AS locality_name,
        pc.category_name AS primary_category_name, pc.category_slug AS primary_category_slug
      FROM businesses b
      JOIN cities city ON city.id = b.city_id
      LEFT JOIN localities loc ON loc.id = b.locality_id
      LEFT JOIN primary_category pc ON pc.business_id = b.id
      WHERE b.deleted_at IS NULL AND b.status = 'approved'
      ORDER BY (b.plan_tier != 'basic') DESC, b.avg_rating DESC NULLS LAST
      LIMIT 3000
    )
    SELECT id, name FROM base_candidates
  `);
  console.log(`⏱️ Pool Size 3000 Query Time: ${Date.now() - start1} ms`);

  const start2 = Date.now();
  await prisma.$queryRawUnsafe(`
    WITH primary_category AS (
      SELECT bc.business_id, c.name AS category_name, c.slug AS category_slug, c.parent_id AS category_parent_id
      FROM business_categories bc
      JOIN categories c ON c.id = bc.category_id
      WHERE bc.is_primary = true
    ),
    base_candidates AS (
      SELECT b.*, city.slug AS city_slug, city.name AS city_name,
        loc.slug AS locality_slug, loc.name AS locality_name,
        pc.category_name AS primary_category_name, pc.category_slug AS primary_category_slug
      FROM businesses b
      JOIN cities city ON city.id = b.city_id
      LEFT JOIN localities loc ON loc.id = b.locality_id
      LEFT JOIN primary_category pc ON pc.business_id = b.id
      WHERE b.deleted_at IS NULL AND b.status = 'approved'
      ORDER BY (b.plan_tier != 'basic') DESC, b.avg_rating DESC NULLS LAST
      LIMIT 300
    )
    SELECT id, name FROM base_candidates
  `);
  console.log(`⚡ Pool Size 300 Query Time: ${Date.now() - start2} ms`);

  await prisma.$disconnect();
}

benchmark().catch(console.error);
