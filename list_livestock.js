const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function list() {
  const listings = await prisma.livestock.findMany({
    include: { seller: true }
  });
  console.log(JSON.stringify(listings, null, 2));
  await prisma.$disconnect();
}

list();
