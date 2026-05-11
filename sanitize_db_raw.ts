import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🧹 Saneando Base de Datos con SQL puro...');
    
    // Usamos SQL crudo para saltar las validaciones de Enum de Prisma
    const rows1 = await prisma.$executeRawUnsafe(
      `UPDATE "Livestock" SET status = 'AVAILABLE' WHERE status = 'DISPONIBLE'`
    );
    console.log(`✅ ${rows1} registros actualizados de DISPONIBLE a AVAILABLE`);

    const rows2 = await prisma.$executeRawUnsafe(
      `UPDATE "Livestock" SET status = 'SOLD' WHERE status = 'VENDIDO'`
    );
    console.log(`✅ ${rows2} registros actualizados de VENDIDO a SOLD`);

    console.log('✨ Base de datos limpia y lista.');
  } catch (error) {
    console.error('❌ Error de SQL:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
