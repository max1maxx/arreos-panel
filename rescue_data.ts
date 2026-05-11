import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('🩺 Iniciando cirugía de datos (Modo Seguro)...');
    
    // 1. Convertimos la columna a TEXTO para quitar la restricción del Enum
    console.log('1. Relajando restricciones de columna...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Livestock" ALTER COLUMN status TYPE TEXT`
    );

    // 2. Ahora que es texto, podemos traducir sin que Postgres proteste
    console.log('2. Traduciendo registros existentes...');
    const rows1 = await prisma.$executeRawUnsafe(
      `UPDATE "Livestock" SET status = 'AVAILABLE' WHERE status = 'DISPONIBLE' OR status = 'available'`
    );
    const rows2 = await prisma.$executeRawUnsafe(
      `UPDATE "Livestock" SET status = 'SOLD' WHERE status = 'VENDIDO' OR status = 'sold'`
    );
    console.log(`✅ ${rows1 + rows2} registros saneados.`);

    // 3. Volvemos a convertir la columna a nuestro Enum "LivestockStatus"
    // Usamos USING status::"LivestockStatus" para que Postgres reconozca el tipo
    console.log('3. Restaurando integridad de tipos (Enum)...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE "Livestock" ALTER COLUMN status TYPE "LivestockStatus" USING status::"LivestockStatus"`
    );

    console.log('✨ Cirugía completada con éxito. Los datos están a salvo y en inglés.');
  } catch (error) {
    console.error('❌ Error durante la cirugía:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
