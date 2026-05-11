const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    const email = "jonatcraft@gmail.com";
    const password = "123@Admin";
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.upsert({
      where: { email },
      update: {
        first_name: "Jonathan",
        last_name: "Velasquez",
        document_number: "2350933806001",
        phone: "0985742519",
        role: "ADMIN",
        is_verified: true,
      },
      create: {
        email,
        password_hash: hashedPassword,
        first_name: "Jonathan",
        last_name: "Velasquez",
        document_number: "2350933806001",
        phone: "0985742519",
        role: "ADMIN",
        is_verified: true,
      },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      update: {},
      create: {
        userId: user.id,
        finca_name: "Admin Finca",
      },
    });

    console.log("Usuario ADMIN creado/actualizado con éxito:", user.email);
  } catch (error) {
    console.error("Error creando el admin:", error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
