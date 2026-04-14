import { prisma } from '../database/prisma';
import { UserRole } from '@prisma/client';
import { UserEntity } from '../../core/entities/User';

export interface CreateUserData {
  email: string;
  password_hash: string;
  first_name?: string;
  last_name?: string;
  document_type?: string;
  document_number?: string;
  phone?: string;
  role: UserRole;
  profile: {
    finca_name?: string;
    license_type?: string;
    vehicle_capacity?: number;
  };
}

export interface UpdateUserData {
  email?: string;
  password_hash?: string;
  first_name?: string | null;
  last_name?: string | null;
  document_type?: string | null;
  document_number?: string | null;
  phone?: string | null;
  role?: UserRole;
  is_verified?: boolean;
  profile?: {
    finca_name?: string | null;
    license_type?: string | null;
    vehicle_capacity?: number | null;
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

  async findByDocumentNumber(document_number: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { document_number },
      include: { profile: true },
    });
    
    return user ? (user as unknown as UserEntity) : null;
  }

  async findAll(): Promise<UserEntity[]> {
    const users = await prisma.user.findMany({
      include: { profile: true },
      orderBy: { createdAt: 'desc' },
    });
    return users as unknown as UserEntity[];
  }

  async createUser(data: CreateUserData): Promise<UserEntity> {
    const user = await prisma.user.create({
      data: {
        email: data.email,
        password_hash: data.password_hash,
        first_name: data.first_name,
        last_name: data.last_name,
        document_type: data.document_type,
        document_number: data.document_number,
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

  async updateUser(id: string, data: UpdateUserData): Promise<UserEntity> {
    const updateData: Record<string, unknown> = {
      ...(data.email && { email: data.email }),
      ...(data.password_hash && { password_hash: data.password_hash }),
      ...(data.first_name !== undefined && { first_name: data.first_name }),
      ...(data.last_name !== undefined && { last_name: data.last_name }),
      ...(data.document_type !== undefined && { document_type: data.document_type }),
      ...(data.document_number !== undefined && { document_number: data.document_number }),
      ...(data.phone !== undefined && { phone: data.phone }),
      ...(data.role && { role: data.role }),
      ...(data.is_verified !== undefined && { is_verified: data.is_verified }),
    };

    if (data.profile) {
      updateData.profile = {
        upsert: {
          create: {
            finca_name: data.profile.finca_name,
            license_type: data.profile.license_type,
            vehicle_capacity: data.profile.vehicle_capacity,
          },
          update: {
            finca_name: data.profile.finca_name,
            license_type: data.profile.license_type,
            vehicle_capacity: data.profile.vehicle_capacity,
          }
        }
      };
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      include: { profile: true },
    });

    return user as unknown as UserEntity;
  }

  async deleteUser(id: string): Promise<void> {
    await prisma.user.delete({
      where: { id }
    });
  }
}
