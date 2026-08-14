const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function run() {
  const res = await prisma.user.updateMany({
    where: {
      OR: [
        { email: { contains: 'rocky' } },
        { email: { contains: '01fe' } },
        { name: { contains: 'Rocky' } },
      ],
    },
    data: { role: 'business_owner' },
  });
  console.log('Updated users count:', res.count);
  await prisma.$disconnect();
}

run();
