import bcrypt from 'bcryptjs';
import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { LoginInput } from '../../../lib/validations/auth';
import { UserEntity } from '../../entities/User';

export class LoginUserUseCase {
  constructor(private userRepository: UserRepository) {}

  async execute(input: LoginInput): Promise<{ user: UserEntity }> {
    // 1. Buscar usuario por email
    const user = await this.userRepository.findByEmailWithPassword(input.email);
    
    // Si no existe, lanzamos error genérico para no dar pistas
    if (!user) {
      throw new Error('Credenciales inválidas');
    }

    // 2. Verificar la contraseña
    const isValidPassword = await bcrypt.compare(input.password, user.password_hash);
    
    if (!isValidPassword) {
      throw new Error('Credenciales inválidas');
    }

    // 3. Retornar el usuario sin la contraseña
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = user;
    
    return { user: userWithoutPassword as UserEntity };
  }
}
