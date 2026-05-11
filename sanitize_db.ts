import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Iniciando saneamiento de estados...');
    
    // Convertir DISPONIBLE -> AVAILABLE
    const updateAvailable = await prisma.livestock.updateMany({
      where: { status: 'DISPONIBLE' as any },
      data: { status: 'AVAILABLE' as any },
    });
    console.log(`✅ ${updateAvailable.count} registros actualizados a AVAILABLE`);

    // Convertir VENDIDO -> SOLD
    const updateSold = await prisma.livestock.updateMany({
      where: { status: 'VENDIDO' as any },
      data: { status: 'SOLD' as any },
    });
    console.log(`✅ ${updateSold.count} registros actualizados a SOLD`);

    console.log('✨ Saneamiento completado con éxito.');
  } catch (error) {
    console.error('❌ Error durante el saneamiento:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
