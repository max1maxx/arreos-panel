import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('💉 Inyectando valores en inglés al Enum de Postgres...');
    
    // Postgres no permite ALTER TYPE dentro de una transacción en algunos casos,
    // así que los ejecutamos uno por uno.
    const statuses = ['AVAILABLE', 'SOLD', 'RESERVED', 'IN_TRANSIT'];
    
    for (const status of statuses) {
      try {
        await prisma.$executeRawUnsafe(
          `ALTER TYPE "LivestockStatus" ADD VALUE '${status}'`
        );
        console.log(`✅ Valor ${status} añadido.`);
      } catch (e: any) {
        if (e.message.includes('already exists')) {
          console.log(`ℹ️ El valor ${status} ya existía.`);
        } else {
          throw e;
        }
      }
    }

    console.log('🧹 Limpiando registros viejos...');
    await prisma.$executeRawUnsafe(
      `UPDATE "Livestock" SET status = 'AVAILABLE' WHERE status = 'DISPONIBLE'`
    );
    
    console.log('✨ Base de datos lista.');
  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
