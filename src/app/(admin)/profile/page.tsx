import { getCurrentUser } from '../../../lib/auth-server';
import { redirect } from 'next/navigation';
import ProfileClientPanel from './ProfileClientPanel';

export default async function ProfilePage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) redirect('/login');

  return (
    <div className="p-6 md:p-10 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Mi Perfil</h1>
        <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm md:text-base">Actualiza tu información personal y credenciales.</p>
      </div>
      
      <ProfileClientPanel initialUser={currentUser} />
    </div>
  );
}
