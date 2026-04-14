'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Mail, Lock, Phone, User as UserIcon, CreditCard, Truck } from 'lucide-react';
import { UserEntity } from '../../../core/entities/User';
import { useRouter } from 'next/navigation';

const profileSchema = z.object({
  first_name: z.string().min(2, "El nombre debe tener al menos 2 caracteres").max(100, "El nombre no puede exceder 100 caracteres"),
  last_name: z.string().min(2, "El apellido debe tener al menos 2 caracteres").max(100, "El apellido no puede exceder 100 caracteres"),
  document_type: z.enum(["CEDULA", "RUC", "PASAPORTE"]),
  document_number: z.string().min(1, "Este campo es requerido"),
  email: z.string().email("Debe ser un correo electrónico válido").max(100, "El correo no puede exceder 100 caracteres"),
  password: z.string().optional().or(z.literal('')),
  phone: z.string().regex(/^\+?[0-9\s\-\(\)]{7,20}$/, "Debe ser un teléfono válido (7 a 20 dígitos)").optional().or(z.literal('')),
  finca_name: z.string().max(100, "No puede exceder 100 caracteres").optional().or(z.literal('')),
  license_type: z.string().max(50, "No puede exceder 50 caracteres").optional().or(z.literal('')),
  vehicle_capacity: z.string().optional().or(z.literal('')),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

export default function ProfileClientPanel({ initialUser }: { initialUser: UserEntity }) {
  const [isPending, setIsPending] = useState(false);
  const router = useRouter();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    mode: 'onChange',
    defaultValues: {
      first_name: initialUser.first_name || '',
      last_name: initialUser.last_name || '',
      document_type: (initialUser.document_type as "CEDULA" | "RUC" | "PASAPORTE") || 'CEDULA',
      document_number: initialUser.document_number || '',
      email: initialUser.email || '',
      password: '',
      phone: initialUser.phone || '',
      finca_name: initialUser.profile?.finca_name || '',
      license_type: initialUser.profile?.license_type || '',
      vehicle_capacity: initialUser.profile?.vehicle_capacity ? initialUser.profile.vehicle_capacity.toString() : '',
    }
  });

  async function onSubmit(data: ProfileFormValues) {
    setIsPending(true);
    try {
      const updateData: Record<string, unknown> = { ...data };
      if (!updateData.password) delete updateData.password;
      
      updateData.profile = {
        finca_name: data.finca_name || null,
        license_type: data.license_type || null,
        vehicle_capacity: data.vehicle_capacity ? Number(data.vehicle_capacity) : null,
      };

      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || 'No se pudo actualizar el perfil');
      } else {
        toast.success('Perfil actualizado correctamente');
        form.setValue('password', '');
        router.refresh();
      }
    } catch {
      toast.error('Ocurrió un error inesperado');
    } finally {
      setIsPending(false);
    }
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden"
    >
      <div className="p-6 md:p-8">
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Nombres</label>
              <input {...form.register("first_name")} type="text" placeholder="Ej. Juan" className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border ${form.formState.errors.first_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
              {form.formState.errors.first_name && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.first_name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Apellidos</label>
              <input {...form.register("last_name")} type="text" placeholder="Ej. Pérez" className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border ${form.formState.errors.last_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
              {form.formState.errors.last_name && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.last_name.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[1fr_2fr] gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Tipo de Doc.</label>
              <select {...form.register("document_type")} className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white">
                <option value="CEDULA">Cédula</option>
                <option value="RUC">RUC</option>
                <option value="PASAPORTE">Pasaporte</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Número de Documento</label>
              <input {...form.register("document_number")} type="text" placeholder="Ej. 1712345678" className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border ${form.formState.errors.document_number ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
              {form.formState.errors.document_number && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.document_number.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Email</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-slate-400" />
                </div>
                <input {...form.register("email")} type="email" className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border ${form.formState.errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
              </div>
              {form.formState.errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Teléfono</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Phone className="h-4 w-4 text-slate-400" />
                </div>
                <input {...form.register("phone")} type="tel" className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border ${form.formState.errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
              </div>
              {form.formState.errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.phone.message}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Nueva Contraseña</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Lock className="h-4 w-4 text-slate-400" />
              </div>
              <input {...form.register("password")} type="password" placeholder="Dejar en blanco para no cambiar" className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border ${form.formState.errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
            </div>
            {form.formState.errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.password.message}</p>}
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><UserIcon className="w-5 h-5"/> Perfil Adicional</h3>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Nombre de Finca</label>
                <input {...form.register("finca_name")} type="text" placeholder="Opcional" className={`w-full px-4 py-3 bg-slate-50 dark:bg-slate-950 border ${form.formState.errors.finca_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                {form.formState.errors.finca_name && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.finca_name.message}</p>}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Licencia</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <CreditCard className="h-4 w-4 text-slate-400" />
                    </div>
                    <input {...form.register("license_type")} type="text" placeholder="Opcional" className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border ${form.formState.errors.license_type ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                  </div>
                  {form.formState.errors.license_type && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.license_type.message}</p>}
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Capacidad Vehículo (lbs)</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                      <Truck className="h-4 w-4 text-slate-400" />
                    </div>
                    <input {...form.register("vehicle_capacity")} type="number" placeholder="Opcional" className={`w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-950 border ${form.formState.errors.vehicle_capacity ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                  </div>
                  {form.formState.errors.vehicle_capacity && <p className="text-red-500 text-xs mt-1 ml-1">{form.formState.errors.vehicle_capacity.message}</p>}
                </div>
              </div>
            </div>
          </div>

          <div className="pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-end">
            <button type="submit" disabled={isPending} className="w-full md:w-auto px-8 py-3 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md">
              {isPending ? 'Guardando...' : 'Guardar Cambios'}
            </button>
          </div>
        </form>
      </div>
    </motion.div>
  );
}
