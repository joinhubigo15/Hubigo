import dotenv from "dotenv";
import path from "path";
import { PrismaClient } from "@prisma/client";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const connectionString = process.env.DATABASE_URL || "postgresql://postgres:Hubigo%400001@db.qqprflamdzviyteqnzht.supabase.co:5432/postgres";
const prisma = new PrismaClient({ datasources: { db: { url: connectionString } } });

async function checkIndexes() {
  const indexes: any[] = await prisma.$queryRawUnsafe(`
    SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'businesses'
  `);
  console.log(`Current Indexes on businesses table (${indexes.length} indexes):`);
  indexes.forEach((idx) => console.log(` - ${idx.indexname}: ${idx.indexdef}`));
  await prisma.$disconnect();
}

checkIndexes().catch(console.error);
