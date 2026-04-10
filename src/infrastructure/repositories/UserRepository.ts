import { prisma } from '../database/prisma';
import { UserRole } from '@prisma/client';
import { UserEntity } from '../../core/entities/User';

export interface CreateUserData {
  email: string;
  password_hash: string;
  phone?: string;
  role: UserRole;
  profile: {
    finca_name?: string;
    license_type?: string;
    vehicle_capacity?: number;
  };
}

export interface UserWithPasswordEntity extends UserEntity {
  password_hash: string;
}

export class UserRepository {
  async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
    
    return user ? (user as unknown as UserEntity) : null;
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    
    return user ? (user as unknown as UserEntity) : null;
  }

  async findByEmailWithPassword(email: string): Promise<UserWithPasswordEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { profile: true },
    });
    
    return user ? (user as unknown as UserWithPasswordEntity) : null;
  }

  async createUser(data: CreateUserData): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash: data.password_hash,
        phone: data.phone,
        role: data.role,
        profile: {
          create: {
            finca_name: data.profile.finca_name,
            license_type: data.profile.license_type,
            vehicle_capacity: data.profile.vehicle_capacity,
          }
        }
      },
      include: { profile: true },
    });

    return user as unknown as UserEntity;
  }
}
