const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany();
  console.log('ALL USERS IN DB:', JSON.stringify(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })), null, 2));

  // Update ALL existing users in DB to business_owner as requested
  const res = await prisma.user.updateMany({
    data: { role: 'business_owner' },
  });
  console.log('Updated ALL users to business_owner. Count:', res.count);

  await prisma.$disconnect();
}

main();
