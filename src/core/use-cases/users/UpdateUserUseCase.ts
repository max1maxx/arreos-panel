import { UserRepository, UpdateUserData } from '../../../infrastructure/repositories/UserRepository';
import { UserEntity } from '../../entities/User';
import bcrypt from 'bcryptjs';

export class UpdateUserUseCase {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(id: string, data: Omit<UpdateUserData, 'password_hash'> & { password?: string }): Promise<UserEntity> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    const updateData: UpdateUserData = { ...data };

    if (data.password) {
      updateData.password_hash = await bcrypt.hash(data.password, 10);
      Reflect.deleteProperty(updateData, 'password');
    }

    if (data.email && data.email !== user.email) {
      const existingEmail = await this.userRepository.findByEmail(data.email);
      if (existingEmail) {
        throw new Error('El correo ya está en uso');
      }
    }

    if (data.document_number && data.document_number !== user.document_number) {
      const existingDoc = await this.userRepository.findByDocumentNumber(data.document_number);
      if (existingDoc) {
        throw new Error('Este número de documento ya está registrado por otro usuario');
      }
    }

    return await this.userRepository.updateUser(id, updateData);
  }
}
