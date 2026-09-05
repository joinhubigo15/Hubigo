import { PrismaClient } from '@prisma/client';
import { execSync } from 'child_process';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '../.env') });

const sourceDbUrl = process.env.DATABASE_URL;
const targetDbUrl = process.env.NEW_DATABASE_URL;

if (!targetDbUrl) {
  console.error('❌ Error: NEW_DATABASE_URL is not set!');
  process.exit(1);
}

console.log('🚀 Starting Full Database Migration to Supabase...');

async function migrate() {
  const sourcePrisma = new PrismaClient({
    datasources: { db: { url: sourceDbUrl } },
  });

  const targetPrisma = new PrismaClient({
    datasources: { db: { url: targetDbUrl } },
  });

  try {
    console.log('📦 Pushing schema to target database...');
    execSync(`npx prisma db push --schema=prisma/schema.prisma --accept-data-loss`, {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: targetDbUrl },
      stdio: 'inherit',
    });

    console.log('1️⃣ Migrating Categories...');
    const categories = await sourcePrisma.category.findMany();
    if (categories.length > 0) {
      const sortedCategories = categories.sort((a, b) => {
        if (a.parentId === null && b.parentId !== null) return -1;
        if (a.parentId !== null && b.parentId === null) return 1;
        return 0;
      });
      for (const cat of sortedCategories) {
        await targetPrisma.category.upsert({
          where: { id: cat.id },
          create: cat,
          update: cat,
        });
      }
      console.log(`   ✅ Transferred ${categories.length} categories.`);
    }

    console.log('2️⃣ Migrating Cities...');
    const cities = await sourcePrisma.city.findMany();
    if (cities.length > 0) {
      await targetPrisma.city.createMany({ data: cities, skipDuplicates: true });
      console.log(`   ✅ Transferred ${cities.length} cities.`);
    }

    console.log('3️⃣ Migrating Localities...');
    const localities = await sourcePrisma.locality.findMany();
    if (localities.length > 0) {
      await targetPrisma.locality.createMany({ data: localities, skipDuplicates: true });
      console.log(`   ✅ Transferred ${localities.length} localities.`);
    }

    console.log('4️⃣ Migrating Pincode Areas...');
    const pincodes = await sourcePrisma.pincodeArea.findMany();
    if (pincodes.length > 0) {
      await targetPrisma.pincodeArea.createMany({ data: pincodes, skipDuplicates: true });
      console.log(`   ✅ Transferred ${pincodes.length} pincode areas.`);
    }

    console.log('5️⃣ Migrating Amenities...');
    const amenities = await sourcePrisma.amenity.findMany();
    if (amenities.length > 0) {
      await targetPrisma.amenity.createMany({ data: amenities, skipDuplicates: true });
      console.log(`   ✅ Transferred ${amenities.length} amenities.`);
    }

    console.log('6️⃣ Migrating Users...');
    const users = await sourcePrisma.user.findMany();
    if (users.length > 0) {
      await targetPrisma.user.createMany({ data: users, skipDuplicates: true });
      console.log(`   ✅ Transferred ${users.length} users.`);
    }

    console.log('7️⃣ Batch Migrating Businesses...');
    const batchSize = 1000;
    let skip = 0;
    let totalMigrated = 0;

    while (true) {
      const businesses = await sourcePrisma.business.findMany({
        take: batchSize,
        skip: skip,
        orderBy: { createdAt: 'asc' },
      });

      if (businesses.length === 0) break;

      console.log(`   Processing batch ${Math.floor(skip / batchSize) + 1} (${businesses.length} businesses)...`);
      await targetPrisma.business.createMany({
        data: businesses,
        skipDuplicates: true,
      });

      totalMigrated += businesses.length;
      skip += batchSize;
    }
    console.log(`   ✅ Transferred ${totalMigrated} businesses!`);

    console.log('8️⃣ Migrating Business Categories...');
    const bizCats = await sourcePrisma.businessCategory.findMany();
    if (bizCats.length > 0) {
      await targetPrisma.businessCategory.createMany({ data: bizCats, skipDuplicates: true });
      console.log(`   ✅ Transferred ${bizCats.length} business category join records.`);
    }

    console.log('9️⃣ Migrating Business Media...');
    const media = await sourcePrisma.businessMedia.findMany();
    if (media.length > 0) {
      await targetPrisma.businessMedia.createMany({ data: media, skipDuplicates: true });
      console.log(`   ✅ Transferred ${media.length} media items.`);
    }

    console.log('🔟 Migrating Business Hours...');
    const hours = await sourcePrisma.businessHours.findMany();
    if (hours.length > 0) {
      await targetPrisma.businessHours.createMany({ data: hours, skipDuplicates: true });
      console.log(`   ✅ Transferred ${hours.length} business hours.`);
    }

    console.log('1️⃣1️⃣ Migrating Business Services...');
    const services = await sourcePrisma.businessService.findMany();
    if (services.length > 0) {
      await targetPrisma.businessService.createMany({ data: services, skipDuplicates: true });
      console.log(`   ✅ Transferred ${services.length} services.`);
    }

    console.log('🎉 ALL DATA FULLY MIGRATED TO SUPABASE SUCCESSFULLY!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

migrate();
