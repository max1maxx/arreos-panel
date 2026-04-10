import { describe, it, expect, vi, beforeEach } from 'vitest';
import { RegisterUserUseCase } from './RegisterUserUseCase';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { RegisterInput } from '../../../lib/validations/auth';

// Mock del repositorio
const mockUserRepository = {
  findByEmail: vi.fn(),
  createUser: vi.fn(),
} as unknown as UserRepository;

describe('RegisterUserUseCase', () => {
  let useCase: RegisterUserUseCase;

  beforeEach(() => {
    vi.clearAllMocks();
    useCase = new RegisterUserUseCase(mockUserRepository);
  });

  it('debería arrojar un error si el usuario ya existe', async () => {
    // Simulamos que findByEmail devuelve un usuario existente
    (mockUserRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue({ id: '123', email: 'test@test.com' });

    const input: RegisterInput = {
      email: 'test@test.com',
      password: 'password123',
      role: 'PRODUCER',
      finca_name: 'Finca La Esperanza',
    };

    await expect(useCase.execute(input)).rejects.toThrow('El correo electrónico ya está registrado');
    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('test@test.com');
    expect(mockUserRepository.createUser).not.toHaveBeenCalled();
  });

  it('debería registrar un PRODUCER correctamente en el repositorio', async () => {
    // Simulamos que el usuario NO existe
    (mockUserRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    
    // Simulamos la creación exitosa
    (mockUserRepository.createUser as ReturnType<typeof vi.fn>).mockResolvedValue({
      id: '1',
      email: 'producer@test.com',
      role: 'PRODUCER',
      profile: { finca_name: 'Mi Finca' }
    });

    const input: RegisterInput = {
      email: 'producer@test.com',
      password: 'password123',
      role: 'PRODUCER',
      finca_name: 'Mi Finca',
    };

    const result = await useCase.execute(input);

    expect(mockUserRepository.findByEmail).toHaveBeenCalledWith('producer@test.com');
    expect(mockUserRepository.createUser).toHaveBeenCalled();
    
    // Verificamos que se llame con los datos correctos (contraseña encriptada)
    const createCall = (mockUserRepository.createUser as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.email).toBe('producer@test.com');
    expect(createCall.role).toBe('PRODUCER');
    expect(createCall.profile.finca_name).toBe('Mi Finca');
    // La contraseña debe estar encriptada (no puede ser 'password123')
    expect(createCall.password_hash).not.toBe('password123');
    expect(typeof createCall.password_hash).toBe('string');
    
    expect(result.user.id).toBe('1');
  });

  it('debería registrar un DRIVER correctamente, extrayendo sus propiedades', async () => {
    (mockUserRepository.findByEmail as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (mockUserRepository.createUser as ReturnType<typeof vi.fn>).mockResolvedValue({ id: '2', role: 'DRIVER' });

    const input: RegisterInput = {
      email: 'driver@test.com',
      password: 'password123',
      role: 'DRIVER',
      license_type: 'Categoría 4',
      vehicle_capacity: 5000, // 5000 lbs
    };

    await useCase.execute(input);

    const createCall = (mockUserRepository.createUser as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(createCall.email).toBe('driver@test.com');
    expect(createCall.role).toBe('DRIVER');
    expect(createCall.profile.license_type).toBe('Categoría 4');
    expect(createCall.profile.vehicle_capacity).toBe(5000);
    // Un chofer no debería tener finca_name asignado en su perfil según el UseCase
    expect(createCall.profile.finca_name).toBeUndefined();
  });
});
