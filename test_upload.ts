import axios from 'axios';
import FormData from 'form-data';
import { PrismaClient } from '@prisma/client';

async function test() {
  const prisma = new PrismaClient();
  const user = await prisma.user.findFirst();
  
  if (!user) {
    console.error('No hay usuarios en la DB para probar.');
    return;
  }

  console.log(`🚀 Iniciando prueba de subida para usuario: ${user.email}`);

  const form = new FormData();
  form.append('sellerId', user.id);
  form.append('category', 'Bovino');
  form.append('breed', 'Brahman Prueba');
  form.append('weight', '500');
  form.append('quantity', '1');
  form.append('price_per_lb', '1.5');
  form.append('description', 'Publicación de prueba técnica');
  form.append('province', 'Pichincha');
  form.append('city', 'Quito');

  try {
    const response = await axios.post('http://localhost:3000/api/livestock', form, {
      headers: form.getHeaders(),
    });
    console.log('✅ BACKEND RESPONDIÓ:', response.data);
  } catch (error: any) {
    console.error('❌ EL BACKEND FALLÓ:', error.response?.data || error.message);
  } finally {
    await prisma.$disconnect();
  }
}

test();
