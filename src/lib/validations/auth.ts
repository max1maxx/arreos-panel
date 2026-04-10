import { z } from 'zod';
import { UserRole } from '@prisma/client';

export const RegisterSchema = z.object({
  email: z.string()
    .trim()
    .toLowerCase()
    .email('Correo electrónico no válido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/[a-z]/, 'La contraseña debe contener al menos una minúscula')
    .regex(/[A-Z]/, 'La contraseña debe contener al menos una mayúscula')
    .regex(/[0-9]/, 'La contraseña debe contener al menos un número'),
  phone: z.string().optional(),
  role: z.nativeEnum(UserRole, {
    message: 'El rol seleccionado no es válido'
  }).refine(role => role !== 'ADMIN', {
    message: 'El registro público no está permitido para este rol'
  }),
  // Campos del Profile que varían según el rol
  finca_name: z.string().optional(),
  license_type: z.string().optional(),
  vehicle_capacity: z.coerce.number().optional(),
}).refine(data => {
  if (data.role === 'PRODUCER' && !data.finca_name) {
    return false; // PRODUCER necesita nombre de la finca
  }
  return true;
}, {
  message: 'El nombre de la finca es obligatorio para un Productor',
  path: ['finca_name'],
}).refine(data => {
  if (data.role === 'DRIVER' && (!data.license_type || !data.vehicle_capacity)) {
    return false; // DRIVER necesita licencia y capacidad
  }
  return true;
}, {
  message: 'El tipo de licencia y la capacidad son obligatorios para un Chofer',
  path: ['license_type', 'vehicle_capacity'],
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Correo electrónico no válido'),
  password: z.string().min(1, 'La contraseña es obligatoria'),
});

export type LoginInput = z.infer<typeof LoginSchema>;
