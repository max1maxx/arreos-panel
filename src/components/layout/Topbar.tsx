"use client";

import { usePathname } from "next/navigation";
import { ThemeToggle } from "../ui/ThemeToggle";
import { Bell, Search } from "lucide-react";

interface TopbarProps {
  user?: {
    email: string;
    role: string;
  };
}

export function Topbar({ user }: TopbarProps) {
  const pathname = usePathname();
  
  // Mapear rutas a títulos bonitos
  const getTitle = () => {
    if (pathname === "/") return "Panel Principal";
    if (pathname.startsWith("/users")) return "Gestión de Usuarios";
    return "Dashboard";
  };

  return (
    <header className="h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 sticky top-0 z-40 transition-colors duration-300">
      <div>
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">{getTitle()}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Barra de búsqueda global simulada */}
        <div className="hidden md:flex relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            type="text"
            placeholder="Buscar..."
            className="w-64 pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-800/50 border-none rounded-full text-sm focus:ring-2 focus:ring-blue-500 dark:text-white outline-none transition-all"
          />
        </div>

        <button className="p-2.5 rounded-full text-slate-500 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors relative">
          <Bell className="w-5 h-5" />
          <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white dark:border-slate-900"></span>
        </button>

        <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-2"></div>

        <ThemeToggle />

        <div className="flex items-center gap-3 ml-2">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold shadow-md uppercase">
            {user ? user.email.substring(0, 2) : 'AD'}
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-semibold text-slate-900 dark:text-white capitalize">{user ? user.role.toLowerCase() : 'Admin'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{user ? user.email : 'admin@arreos.com'}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
