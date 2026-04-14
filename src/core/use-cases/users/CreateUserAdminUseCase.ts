import { UserRepository, CreateUserData } from '../../../infrastructure/repositories/UserRepository';
import { UserEntity } from '../../entities/User';
import bcrypt from 'bcryptjs';

export class CreateUserAdminUseCase {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(data: Omit<CreateUserData, 'password_hash'> & { password?: string }): Promise<UserEntity> {
    const existingUser = await this.userRepository.findByEmail(data.email);
    if (existingUser) {
      throw new Error('El correo ya está en uso');
    }

    if (data.document_number) {
      const existingDoc = await this.userRepository.findByDocumentNumber(data.document_number);
      if (existingDoc) {
        throw new Error('Este número de documento ya está registrado por otro usuario');
      }
    }

    const password = data.password || 'arreos123';
    const password_hash = await bcrypt.hash(password, 10);

    return await this.userRepository.createUser({
      email: data.email,
      password_hash,
      first_name: data.first_name,
      last_name: data.last_name,
      document_type: data.document_type,
      document_number: data.document_number,
      phone: data.phone,
      role: data.role,
      profile: data.profile,
    });
  }
}
