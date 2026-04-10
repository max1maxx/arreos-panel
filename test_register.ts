import { RegisterUserUseCase } from './src/core/use-cases/auth/RegisterUserUseCase';
import { UserRepository } from './src/infrastructure/repositories/UserRepository';

async function main() {
  const repository = new UserRepository();
  const useCase = new RegisterUserUseCase(repository);
  
  try {
    console.log('Iniciando intento de registro...');
    const result = await useCase.execute({
      email: `test_producer_${Date.now()}@test.com`,
      password: 'password123',
      role: 'PRODUCER',
      finca_name: 'Finca Prueba API'
    });
    console.log('✅ Registro exitoso:', result);
  } catch (error) {
    console.error('❌ Error al registrar:', error);
  }
}

main();
