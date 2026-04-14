import { Sidebar } from "../../components/layout/Sidebar";
import { Topbar } from "../../components/layout/Topbar";
import { getCurrentUser } from "../../lib/auth-server";
import { redirect } from "next/navigation";
import ClientPageWrapper from "./ClientPageWrapper";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
      <Sidebar />
      <div className="pl-64 flex flex-col min-h-screen">
        <Topbar user={{ email: user.email, role: user.role }} />
        <ClientPageWrapper>
          {children}
        </ClientPageWrapper>
      </div>
    </div>
  );
}
