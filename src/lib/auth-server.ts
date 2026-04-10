import { cookies } from 'next/headers';
import { verifyToken } from './jwt';
import { UserRepository } from '../infrastructure/repositories/UserRepository';

export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;

    if (!token) return null;

    const payload = await verifyToken(token);
    if (!payload) return null;

    const repository = new UserRepository();
    const user = await repository.findById(payload.id);

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}
