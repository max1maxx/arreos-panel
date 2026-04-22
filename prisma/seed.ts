import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123@Admin', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'jonatcraft@gmail.com' },
    update: {},
    create: {
      email: 'jonatcraft@gmail.com',
      password_hash: passwordHash,
      first_name: 'Jonathan',
      last_name: 'Velasquez',
      phone: '0985742519',
      role: 'ADMIN',
      is_verified: true,
      profile: {
        create: {
          finca_name: 'Arreos Central',
          bio: 'Administrador Principal del Proyecto Arreos',
        }
      }
    },
  });

  console.log('✅ Usuario Administrador creado/verificado:', admin.email);
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
