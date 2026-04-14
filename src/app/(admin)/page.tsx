import { Users, Truck, FileText, ArrowUpRight } from "lucide-react";

export default function DashboardHome() {
  const stats = [
    { name: "Total de Usuarios", value: "1,248", icon: Users, color: "text-blue-600", bg: "bg-blue-100 dark:bg-blue-900/30" },
    { name: "Viajes Activos", value: "42", icon: Truck, color: "text-emerald-600", bg: "bg-emerald-100 dark:bg-emerald-900/30" },
    { name: "Órdenes Completadas", value: "856", icon: FileText, color: "text-indigo-600", bg: "bg-indigo-100 dark:bg-indigo-900/30" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Bienvenido de nuevo, Administrador 👋</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Aquí tienes un resumen rápido de lo que está sucediendo en Arreos hoy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white dark:bg-slate-900 rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div className={`p-4 rounded-2xl ${stat.bg}`}>
                <stat.icon className={`w-7 h-7 ${stat.color}`} />
              </div>
              <div className="flex items-center gap-1 text-sm font-medium text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-1 rounded-full">
                <span>+12%</span>
                <ArrowUpRight className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-6">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400">{stat.name}</p>
              <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Aquí podrías añadir gráficos u otras secciones en el futuro */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-200 dark:border-slate-800 shadow-sm min-h-[300px] flex items-center justify-center">
        <p className="text-slate-400 dark:text-slate-500">Área para gráfico de actividad mensual...</p>
      </div>
    </div>
  );
}
