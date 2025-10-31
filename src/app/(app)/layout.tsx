
"use client";

import type { ReactNode } from "react";
import { useSidebar, SidebarProvider, Sidebar } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { BottomNav } from "@/components/bottom-nav";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { FcmTokenManager } from "@/components/FcmTokenManager";

function AppLayoutContent({ children }: { children: ReactNode }) {
  const { isMobile } = useSidebar();
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [isUserLoading, user, router]);


  if (isUserLoading || !user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading your account...</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="flex min-h-screen w-full">
      <FcmTokenManager />
      <Sidebar>
        <MainNav />
      </Sidebar>
      <main className="flex-1 flex flex-col bg-background w-full">
        <div className="flex-1 py-4 sm:py-6 lg:py-8 pb-24 md:pb-8">
          {children}
        </div>
      </main>
      {isMobile && <BottomNav />}
    </div>
  );
}

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      <AppLayoutContent>{children}</AppLayoutContent>
    </SidebarProvider>
  );
}
