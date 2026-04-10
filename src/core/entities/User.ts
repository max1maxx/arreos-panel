import { UserRole } from '@prisma/client';

export interface ProfileEntity {
  id: string;
  userId: string;
  finca_name?: string | null;
  license_type?: string | null;
  vehicle_capacity?: number | null;
}

export interface UserEntity {
  id: string;
  email: string;
  phone?: string | null;
  role: UserRole;
  is_verified: boolean;
  profile?: ProfileEntity | null;
  createdAt: Date;
  updatedAt: Date;
}
