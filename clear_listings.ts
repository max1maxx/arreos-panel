import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Iniciando limpieza total de publicaciones...');

    // 1. Borramos las órdenes de flete primero por integridad referencial
    const freightCount = await prisma.freightOrder.deleteMany({});
    console.log(`✅ ${freightCount.count} órdenes de flete eliminadas.`);

    // 2. Borramos todas las publicaciones de ganado
    const livestockCount = await prisma.livestock.deleteMany({});
    console.log(`✅ ${livestockCount.count} publicaciones de ganado eliminadas.`);

    console.log('✨ La base de datos de publicaciones está ahora vacía.');
  } catch (error) {
    console.error('❌ Error durante la limpieza:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
