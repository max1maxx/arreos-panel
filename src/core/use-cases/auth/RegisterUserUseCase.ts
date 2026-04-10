import bcrypt from 'bcryptjs';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { RegisterInput } from '../../../lib/validations/auth';
import { UserEntity } from '../../entities/User';

export class RegisterUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: RegisterInput): Promise<{ user: UserEntity }> {
    // 1. Verificar si el usuario ya existe
    const existingUser = await this.userRepository.findByEmail(input.email);
    if (existingUser) {
      throw new Error('El correo electrónico ya está registrado');
    }

    // 2. Hashear la contraseña (10 rondas de salt)
    const saltRounds = 10;
    const password_hash = await bcrypt.hash(input.password, saltRounds);

    // 3. Preparar los datos del perfil según el rol
    const profileData = {
      finca_name: input.role === 'PRODUCER' ? input.finca_name : undefined,
      license_type: input.role === 'DRIVER' ? input.license_type : undefined,
      vehicle_capacity: input.role === 'DRIVER' ? input.vehicle_capacity : undefined,
    };

    // 4. Crear el usuario en la base de datos
    const user = await this.userRepository.createUser({
      email: input.email,
      password_hash,
      phone: input.phone,
      role: input.role,
      profile: profileData,
    });

    return { user };
  }
}
