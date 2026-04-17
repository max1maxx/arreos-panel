import { Sidebar } from "../../components/layout/Sidebar";
import { SidebarProvider } from "../../components/layout/SidebarContext";
import { MainContent } from "../../components/layout/MainContent";
import { getCurrentUser } from "../../lib/auth-server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <SidebarProvider>
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
        <Sidebar />
        <MainContent user={{ email: user.email, role: user.role }}>
          {children}
        </MainContent>
      </div>
    </SidebarProvider>
  );
}
