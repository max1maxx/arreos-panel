"use client";

import { useSidebar } from "./SidebarContext";
import { Topbar } from "./Topbar";
import ClientPageWrapper from "../../app/(admin)/ClientPageWrapper";

interface MainContentProps {
  children: React.ReactNode;
  user: {
    email: string;
    role: string;
  };
}

export function MainContent({ children, user }: MainContentProps) {
  const { isOpen } = useSidebar();

  return (
    <div className={`flex flex-col min-h-screen transition-all duration-300 ${isOpen ? "md:pl-64" : "pl-0 md:pl-64"}`}>
      <Topbar user={user} />
      <ClientPageWrapper>
        {children}
      </ClientPageWrapper>
    </div>
  );
}
