'use server'

import { revalidatePath } from 'next/cache';
import { CreateUserAdminUseCase } from '../../../core/use-cases/users/CreateUserAdminUseCase';
import { UpdateUserUseCase } from '../../../core/use-cases/users/UpdateUserUseCase';
import { DeleteUserUseCase } from '../../../core/use-cases/users/DeleteUserUseCase';
import { UserRole } from '@prisma/client';
import { getCurrentUser } from '../../../lib/auth-server';

async function checkAdmin() {
  const currentUser = await getCurrentUser();
  if (!currentUser || currentUser.role !== 'ADMIN') {
    throw new Error('No autorizado. Se requieren permisos de administrador.');
  }
}

export async function createUserAction(formData: FormData) {
  try {
    await checkAdmin();
    
    const useCase = new CreateUserAdminUseCase();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const document_type = formData.get('document_type') as string;
    const document_number = formData.get('document_number') as string;
    const role = formData.get('role') as UserRole;
    const phone = formData.get('phone') as string;
    
    const finca_name = formData.get('finca_name') as string;
    const license_type = formData.get('license_type') as string;
    const vehicle_capacity = formData.get('vehicle_capacity') ? Number(formData.get('vehicle_capacity')) : undefined;

    await useCase.execute({
      email,
      password,
      first_name: first_name || undefined,
      last_name: last_name || undefined,
      document_type: document_type || undefined,
      document_number: document_number || undefined,
      role,
      phone: phone || undefined,
      profile: {
        finca_name: finca_name || undefined,
        license_type: license_type || undefined,
        vehicle_capacity: vehicle_capacity,
      }
    });

    revalidatePath('/users');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function updateUserAction(id: string, formData: FormData) {
  try {
    await checkAdmin();
    
    const useCase = new UpdateUserUseCase();
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const first_name = formData.get('first_name') as string;
    const last_name = formData.get('last_name') as string;
    const document_type = formData.get('document_type') as string;
    const document_number = formData.get('document_number') as string;
    const role = formData.get('role') as UserRole;
    const phone = formData.get('phone') as string;
    const is_verified = formData.get('is_verified') === 'true';
    
    const finca_name = formData.get('finca_name') as string;
    const license_type = formData.get('license_type') as string;
    const vehicle_capacity = formData.get('vehicle_capacity') ? Number(formData.get('vehicle_capacity')) : undefined;

    await useCase.execute(id, {
      email,
      password: password || undefined,
      first_name: first_name || null,
      last_name: last_name || null,
      document_type: document_type || null,
      document_number: document_number || null,
      role,
      phone: phone || null,
      is_verified,
      profile: {
        finca_name: finca_name || null,
        license_type: license_type || null,
        vehicle_capacity: vehicle_capacity || null,
      }
    });

    revalidatePath('/users');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function deleteUserAction(id: string) {
  try {
    await checkAdmin();
    
    const useCase = new DeleteUserUseCase();
    await useCase.execute(id);
    revalidatePath('/users');
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}