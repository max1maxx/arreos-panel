'use client';

import { useState, useTransition, useEffect } from 'react';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, Mail, Lock, Phone, User as UserIcon, Shield, CreditCard, Truck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UserEntity } from '../../../core/entities/User';
import { createUserAction, updateUserAction, deleteUserAction } from './actions';
import { UserRole } from '@prisma/client';
import { userSchema, type UserFormValues } from '../../../lib/validations/user';

export default function UsersClientPanel({ initialUsers, currentUserId }: { initialUsers: UserEntity[], currentUserId?: string }) {
  const [users, setUsers] = useState<UserEntity[]>(initialUsers);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserEntity | null>(null);
  const [deletingUser, setDeletingUser] = useState<UserEntity | null>(null);
  
  const [isPending, startTransition] = useTransition();

  const createForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    mode: 'onChange',
    defaultValues: {
      role: 'PRODUCER',
      document_type: 'CEDULA',
    }
  });

  const editForm = useForm<UserFormValues>({
    resolver: zodResolver(userSchema),
    mode: 'onChange',
  });

  useEffect(() => {
    setUsers(initialUsers);
  }, [initialUsers]);

  // Sincronizar form de edición cuando se abre el modal
  useEffect(() => {
    if (editingUser) {
      editForm.reset({
        first_name: editingUser.first_name || '',
        last_name: editingUser.last_name || '',
        document_type: (editingUser.document_type as "CEDULA" | "RUC" | "PASAPORTE") || 'CEDULA',
        document_number: editingUser.document_number || '',
        email: editingUser.email || '',
        password: '',
        role: editingUser.role,
        phone: editingUser.phone || '',
        is_verified: editingUser.is_verified,
        finca_name: editingUser.profile?.finca_name || '',
        license_type: editingUser.profile?.license_type || '',
        vehicle_capacity: editingUser.profile?.vehicle_capacity ? editingUser.profile.vehicle_capacity.toString() : '',
      });
    }
  }, [editingUser, editForm]);

  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.phone && user.phone.includes(searchTerm)) ||
    (user.first_name && user.first_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.last_name && user.last_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (user.document_number && user.document_number.includes(searchTerm))
  );

  function onSubmitCreate(data: UserFormValues) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value.toString());
      }
    });

    startTransition(async () => {
      const res = await createUserAction(formData);
      if (res.success) {
        setIsCreateOpen(false);
        createForm.reset();
        toast.success('Usuario creado con éxito');
      } else {
        toast.error(res.error || 'No se pudo crear el usuario');
      }
    });
  }

  function onSubmitEdit(data: UserFormValues) {
    if (!editingUser) return;
    
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        formData.append(key, value.toString());
      }
    });
    // Ensure boolean is passed explicitly if needed, but our schema outputs boolean which toString() makes 'true'/'false'
    if (data.is_verified) formData.set('is_verified', 'true');
    else formData.set('is_verified', 'false');

    startTransition(async () => {
      const res = await updateUserAction(editingUser.id, formData);
      if (res.success) {
        setEditingUser(null);
        toast.success('Usuario actualizado con éxito');
      } else {
        toast.error(res.error || 'No se pudo actualizar el usuario');
      }
    });
  }

  async function handleDelete() {
    if (!deletingUser) return;
    startTransition(async () => {
      const res = await deleteUserAction(deletingUser.id);
      if (res.success) {
        setDeletingUser(null);
        toast.success('Usuario eliminado con éxito');
      } else {
        toast.error(res.error || 'No se pudo eliminar el usuario');
      }
    });
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'ADMIN': return <span className="px-3 py-1 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded-full text-xs font-semibold tracking-wide">Admin</span>;
      case 'PRODUCER': return <span className="px-3 py-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded-full text-xs font-semibold tracking-wide">Productor</span>;
      case 'DRIVER': return <span className="px-3 py-1 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded-full text-xs font-semibold tracking-wide">Conductor</span>;
      default: return <span className="px-3 py-1 bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400 rounded-full text-xs font-semibold tracking-wide">{role}</span>;
    }
  };

  return (
    <div className="w-full">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden transition-colors duration-300 relative z-10">
        {/* Toolbar */}
        <div className="p-6 border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
          <div className="relative w-full md:w-96 group">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 group-focus-within:text-blue-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Buscar por nombre, correo, cédula..." 
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:text-white outline-none transition-all shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <motion.button 
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { createForm.reset(); setIsCreateOpen(true); }}
            className="w-full md:w-auto bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-5 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 shadow-md hover:bg-slate-800 dark:hover:bg-slate-100 transition-all"
          >
            <Plus className="h-4 w-4" />
            Añadir Usuario
          </motion.button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[400px]">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
              <tr>
                <th className="px-6 py-4 font-semibold">Usuario</th>
                <th className="px-6 py-4 font-semibold">Documento</th>
                <th className="px-6 py-4 font-semibold">Rol</th>
                <th className="px-6 py-4 font-semibold">Verificado</th>
                <th className="px-6 py-4 font-semibold">Teléfono</th>
                <th className="px-6 py-4 font-semibold text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-slate-700 dark:text-slate-300 relative">
              <AnimatePresence>
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">No se encontraron resultados.</td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <motion.tr 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      key={user.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 dark:text-white flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-xs font-bold text-slate-600 dark:text-slate-400 uppercase">
                          {user.first_name ? user.first_name.substring(0, 2) : user.email.substring(0, 2)}
                        </div>
                        <div className="flex flex-col">
                          <div className="flex items-center gap-2">
                            <span>{user.first_name || user.last_name ? `${user.first_name || ''} ${user.last_name || ''}`.trim() : user.email}</span>
                            {user.id === currentUserId && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-400 rounded text-[10px] font-bold tracking-wider uppercase">
                                Tú
                              </span>
                            )}
                          </div>
                          {(user.first_name || user.last_name) && <span className="text-xs text-slate-500 font-normal">{user.email}</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {user.document_number ? (
                          <div className="flex flex-col">
                            <span className="text-xs text-slate-500">{user.document_type || 'CEDULA'}</span>
                            <span>{user.document_number}</span>
                          </div>
                        ) : <span className="text-slate-400">-</span>}
                      </td>
                      <td className="px-6 py-4">
                        {getRoleBadge(user.role)}
                      </td>
                      <td className="px-6 py-4">
                        {user.is_verified ? 
                          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-medium">
                            <CheckCircle2 className="h-5 w-5"/> 
                          </div> : 
                          <div className="flex items-center gap-2 text-slate-400 font-medium">
                            <XCircle className="h-5 w-5"/> 
                          </div>
                        }
                      </td>
                      <td className="px-6 py-4">{user.phone || <span className="text-slate-400">-</span>}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          {user.id !== currentUserId ? (
                            <>
                              <button onClick={() => setEditingUser(user)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 dark:hover:text-blue-400 rounded-xl transition-all">
                                <Edit2 className="h-4 w-4" />
                              </button>
                              <button onClick={() => setDeletingUser(user)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 dark:hover:text-red-400 rounded-xl transition-all">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs font-medium text-slate-400 dark:text-slate-500 py-1.5">No editable</span>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>

      {/* CREATE MODAL */}
      <AnimatePresence>
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setIsCreateOpen(false)}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative z-10 max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Añadir Nuevo Usuario</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Completa los datos para dar de alta en la plataforma.</p>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="createForm" onSubmit={createForm.handleSubmit(onSubmitCreate)} className="space-y-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Nombres</label>
                      <input {...createForm.register("first_name")} type="text" placeholder="Ej. Juan" className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${createForm.formState.errors.first_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                      {createForm.formState.errors.first_name && <p className="text-red-500 text-xs mt-1 ml-1">{createForm.formState.errors.first_name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Apellidos</label>
                      <input {...createForm.register("last_name")} type="text" placeholder="Ej. Pérez" className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${createForm.formState.errors.last_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                      {createForm.formState.errors.last_name && <p className="text-red-500 text-xs mt-1 ml-1">{createForm.formState.errors.last_name.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_2fr] gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Tipo de Doc.</label>
                      <select {...createForm.register("document_type")} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white">
                        <option value="CEDULA">Cédula</option>
                        <option value="RUC">RUC</option>
                        <option value="PASAPORTE">Pasaporte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Número de Documento</label>
                      <input {...createForm.register("document_number")} type="text" placeholder="Ej. 1712345678" className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${createForm.formState.errors.document_number ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                      {createForm.formState.errors.document_number && <p className="text-red-500 text-xs mt-1 ml-1">{createForm.formState.errors.document_number.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input {...createForm.register("email")} type="email" placeholder="correo@ejemplo.com" className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${createForm.formState.errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                    </div>
                    {createForm.formState.errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{createForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Contraseña</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input {...createForm.register("password")} type="password" placeholder="Opcional. Por defecto: arreos123" className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${createForm.formState.errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                    </div>
                    {createForm.formState.errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{createForm.formState.errors.password.message}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Rol</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Shield className="h-4 w-4 text-slate-400" />
                        </div>
                        <select {...createForm.register("role")} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white">
                          {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Teléfono</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Phone className="h-4 w-4 text-slate-400" />
                        </div>
                        <input {...createForm.register("phone")} type="tel" placeholder="+123456789" className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${createForm.formState.errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                      </div>
                      {createForm.formState.errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{createForm.formState.errors.phone.message}</p>}
                    </div>
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><UserIcon className="w-4 h-4"/> Perfil Adicional (Opcional)</h3>
                  <div className="space-y-4">
                    <div>
                      <input {...createForm.register("finca_name")} type="text" placeholder="Nombre de Finca" className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${createForm.formState.errors.finca_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                      {createForm.formState.errors.finca_name && <p className="text-red-500 text-xs mt-1 ml-1">{createForm.formState.errors.finca_name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                          </div>
                          <input {...createForm.register("license_type")} type="text" placeholder="Licencia" className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${createForm.formState.errors.license_type ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                        </div>
                        {createForm.formState.errors.license_type && <p className="text-red-500 text-xs mt-1 ml-1">{createForm.formState.errors.license_type.message}</p>}
                      </div>
                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Truck className="h-4 w-4 text-slate-400" />
                          </div>
                          <input {...createForm.register("vehicle_capacity")} type="number" placeholder="Capacidad (lbs)" className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${createForm.formState.errors.vehicle_capacity ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                        </div>
                        {createForm.formState.errors.vehicle_capacity && <p className="text-red-500 text-xs mt-1 ml-1">{createForm.formState.errors.vehicle_capacity.message}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end gap-3 rounded-b-3xl">
              <button type="button" onClick={() => setIsCreateOpen(false)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Cancelar</button>
              <button form="createForm" type="submit" disabled={isPending} className="px-5 py-2.5 text-sm font-medium bg-slate-900 dark:bg-white text-white dark:text-slate-900 rounded-xl hover:bg-slate-800 dark:hover:bg-slate-100 disabled:opacity-50 transition-all shadow-md">
                Guardar Usuario
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* EDIT MODAL */}
      <AnimatePresence>
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setEditingUser(null)}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col relative z-10 max-h-[90vh]"
          >
            <div className="p-6 border-b border-slate-100 dark:border-slate-800">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Editar Usuario</h2>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="editForm" onSubmit={editForm.handleSubmit(onSubmitEdit)} className="space-y-5">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Nombres</label>
                      <input {...editForm.register("first_name")} type="text" placeholder="Ej. Juan" className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${editForm.formState.errors.first_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                      {editForm.formState.errors.first_name && <p className="text-red-500 text-xs mt-1 ml-1">{editForm.formState.errors.first_name.message}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Apellidos</label>
                      <input {...editForm.register("last_name")} type="text" placeholder="Ej. Pérez" className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${editForm.formState.errors.last_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                      {editForm.formState.errors.last_name && <p className="text-red-500 text-xs mt-1 ml-1">{editForm.formState.errors.last_name.message}</p>}
                    </div>
                  </div>

                  <div className="grid grid-cols-[1fr_2fr] gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Tipo de Doc.</label>
                      <select {...editForm.register("document_type")} className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white">
                        <option value="CEDULA">Cédula</option>
                        <option value="RUC">RUC</option>
                        <option value="PASAPORTE">Pasaporte</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Número de Documento</label>
                      <input {...editForm.register("document_number")} type="text" placeholder="Ej. 1712345678" className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${editForm.formState.errors.document_number ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                      {editForm.formState.errors.document_number && <p className="text-red-500 text-xs mt-1 ml-1">{editForm.formState.errors.document_number.message}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Email</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-4 w-4 text-slate-400" />
                      </div>
                      <input {...editForm.register("email")} type="email" className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${editForm.formState.errors.email ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                    </div>
                    {editForm.formState.errors.email && <p className="text-red-500 text-xs mt-1 ml-1">{editForm.formState.errors.email.message}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Nueva Contraseña (Opcional)</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Lock className="h-4 w-4 text-slate-400" />
                      </div>
                      <input {...editForm.register("password")} type="password" placeholder="Dejar en blanco para no cambiar" className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${editForm.formState.errors.password ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                    </div>
                    {editForm.formState.errors.password && <p className="text-red-500 text-xs mt-1 ml-1">{editForm.formState.errors.password.message}</p>}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Rol</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Shield className="h-4 w-4 text-slate-400" />
                        </div>
                        <select {...editForm.register("role")} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white">
                          {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Verificado</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <CheckCircle2 className="h-4 w-4 text-slate-400" />
                        </div>
                        <select {...editForm.register("is_verified")} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all appearance-none dark:text-white">
                          <option value="true">Sí</option>
                          <option value="false">No</option>
                        </select>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5 ml-1">Teléfono</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Phone className="h-4 w-4 text-slate-400" />
                      </div>
                      <input {...editForm.register("phone")} type="tel" className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${editForm.formState.errors.phone ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                    </div>
                    {editForm.formState.errors.phone && <p className="text-red-500 text-xs mt-1 ml-1">{editForm.formState.errors.phone.message}</p>}
                  </div>
                </div>

                <div className="pt-5 border-t border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2"><UserIcon className="w-4 h-4"/> Perfil</h3>
                  <div className="space-y-4">
                    <div>
                      <input {...editForm.register("finca_name")} type="text" placeholder="Nombre de Finca" className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${editForm.formState.errors.finca_name ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                      {editForm.formState.errors.finca_name && <p className="text-red-500 text-xs mt-1 ml-1">{editForm.formState.errors.finca_name.message}</p>}
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <CreditCard className="h-4 w-4 text-slate-400" />
                          </div>
                          <input {...editForm.register("license_type")} type="text" placeholder="Licencia" className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${editForm.formState.errors.license_type ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                        </div>
                        {editForm.formState.errors.license_type && <p className="text-red-500 text-xs mt-1 ml-1">{editForm.formState.errors.license_type.message}</p>}
                      </div>
                      <div>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                            <Truck className="h-4 w-4 text-slate-400" />
                          </div>
                          <input {...editForm.register("vehicle_capacity")} type="number" placeholder="Capacidad (lbs)" className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border ${editForm.formState.errors.vehicle_capacity ? 'border-red-500' : 'border-slate-200 dark:border-slate-700'} rounded-xl text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white`} />
                        </div>
                        {editForm.formState.errors.vehicle_capacity && <p className="text-red-500 text-xs mt-1 ml-1">{editForm.formState.errors.vehicle_capacity.message}</p>}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex justify-end gap-3 rounded-b-3xl">
              <button type="button" onClick={() => setEditingUser(null)} className="px-5 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors">Cancelar</button>
              <button form="editForm" type="submit" disabled={isPending} className="px-5 py-2.5 text-sm font-medium bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 transition-all shadow-md">
                Actualizar Usuario
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

      {/* DELETE MODAL */}
      <AnimatePresence>
      {deletingUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/40 dark:bg-slate-900/80 backdrop-blur-sm"
            onClick={() => setDeletingUser(null)}
          />
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col relative z-10"
          >
            <div className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 flex items-center justify-center mx-auto mb-5 shadow-inner">
                <Trash2 className="h-8 w-8" />
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Eliminar Usuario</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                ¿Estás seguro de que deseas eliminar permanentemente a <strong className="text-slate-700 dark:text-slate-300">{deletingUser.email}</strong>? Esta acción no se puede deshacer.
              </p>
            </div>
            <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex gap-3">
              <button onClick={() => setDeletingUser(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={isPending} className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-600 text-white rounded-xl hover:bg-red-700 shadow-md transition-all disabled:opacity-50">
                Sí, eliminar
              </button>
            </div>
          </motion.div>
        </div>
      )}
      </AnimatePresence>

    </div>
  );
}
