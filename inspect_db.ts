import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    console.log('--- AUDITORÍA DE BASE DE DATOS ARREOS ---');
    
    // 1. Ver registros actuales
    const listings = await prisma.$queryRaw`SELECT id, category, status FROM "Livestock" LIMIT 10`;
    console.log('Registros en la tabla Livestock:', JSON.stringify(listings, null, 2));

    // 2. Ver definición del Enum en Postgres
    const enumValues = await prisma.$queryRaw`
      SELECT enumlabel 
      FROM pg_enum 
      JOIN pg_type ON pg_enum.enumtypid = pg_type.oid 
      WHERE pg_type.typname = 'LivestockStatus'
    `;
    console.log('Valores permitidos en el Enum de Postgres:', JSON.stringify(enumValues, null, 2));

    // 3. Probar la consulta exacta que hace el API
    console.log('Probando filtro exacto: status = AVAILABLE');
    const testQuery = await prisma.livestock.findMany({
      where: { status: 'AVAILABLE' as any }
    });
    console.log(`✅ Resultado del filtro: ${testQuery.length} registros encontrados.`);

  } catch (error: any) {
    console.error('❌ ERROR CRÍTICO EN DB:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

main();
