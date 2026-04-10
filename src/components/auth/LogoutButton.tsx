'use client';

import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/login');
      router.refresh();
    } catch (error) {
      console.error('Error al cerrar sesión', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="flex items-center text-gray-500 hover:text-red-600 transition-colors"
    >
      <LogOut className="h-5 w-5 mr-2" />
      <span>Cerrar sesión</span>
    </button>
  );
}
