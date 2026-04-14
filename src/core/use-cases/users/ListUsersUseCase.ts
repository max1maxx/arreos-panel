import { UserRepository } from '../../../infrastructure/repositories/UserRepository';
import { UserEntity } from '../../entities/User';

export class ListUsersUseCase {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  async execute(): Promise<UserEntity[]> {
    return await this.userRepository.findAll();
  }
}
