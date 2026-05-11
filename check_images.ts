import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function check() {
  const lastListing = await prisma.livestock.findFirst({
    orderBy: { createdAt: 'desc' }
  });

  if (lastListing) {
    console.log('--- DIAGNÓSTICO DE IMÁGENES ---');
    console.log('ID:', lastListing.id);
    console.log('URLs guardadas en DB:', lastListing.images_url);
    console.log('¿Hay imágenes?', lastListing.images_url.length > 0 ? 'SÍ' : 'NO');
  } else {
    console.log('No hay publicaciones.');
  }
  await prisma.$disconnect();
}

check();
