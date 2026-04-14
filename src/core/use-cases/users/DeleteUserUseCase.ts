import { UserRepository } from '../../../infrastructure/repositories/UserRepository';

export class DeleteUserUseCase {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(id: string): Promise<void> {
    const user = await this.userRepository.findById(id);
    if (!user) {
      throw new Error('Usuario no encontrado');
    }

    await this.userRepository.deleteUser(id);
  }
}
