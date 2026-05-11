import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('Intentando conectar a la base de datos...');
    const result = await prisma.$queryRaw`SELECT 1 as connected`;
    console.log('✅ Conexión exitosa:', result);
  } catch (error) {
    console.error('❌ Error de conexión a la DB:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
