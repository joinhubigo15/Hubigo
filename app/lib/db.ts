import { PrismaClient } from "@prisma/client";

const SUPABASE_POOLER_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres.qqprflamdzviyteqnzht:Hubigo%400001@aws-0-ap-south-1.pooler.supabase.com:6543/postgres?pgbouncer=true";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasources: {
      db: {
        url: SUPABASE_POOLER_URL,
      },
    },
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
