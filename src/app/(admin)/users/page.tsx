import { ListUsersUseCase } from '../../../core/use-cases/users/ListUsersUseCase';
import UsersClientPanel from './UsersClientPanel';
import { getCurrentUser } from '../../../lib/auth-server';
import { redirect } from 'next/navigation';

export default async function UsersPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  const useCase = new ListUsersUseCase();
  const users = await useCase.execute();

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto w-full">
      <div className="mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Usuarios</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">Gestiona los miembros, productores y conductores de la plataforma.</p>
        </div>
      </div>
      
      <UsersClientPanel initialUsers={users} currentUserId={currentUser.id} />
    </div>
  );
}
