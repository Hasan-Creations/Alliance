
'use client';

import React, { type ReactNode, useState, useContext } from "react";
import { useSidebar, SidebarProvider } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { BottomNav } from "@/components/bottom-nav";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";
import { FcmTokenManager } from "@/components/FcmTokenManager";
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { TodoView } from '@/components/todos/todo-view';
import { HabitsView } from '@/components/habits/habits-view';
import { FinanceView } from '@/components/finance/finance-view';
import { SettingsView } from '@/components/settings/settings-view';
import WelcomePage from "./welcome/page";

export type View = 'dashboard' | 'todos' | 'habits' | 'expenses' | 'settings';

export const AppViewContext = React.createContext<{
  view: View;
  setView: (view: View) => void;
}>({
  view: 'dashboard',
  setView: () => {},
});

export default function AppPage() {
  const { user, isUserLoading } = useUser();
  const [view, setView] = useState<View>('dashboard');
  const { isMobile } = useSidebar();
  
  if (isUserLoading) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <WelcomePage />;
  }
  
  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardView />;
      case 'todos':
        return <TodoView />;
      case 'habits':
        return <HabitsView />;
      case 'expenses':
        return <FinanceView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <AppViewContext.Provider value={{ view, setView }}>
       <div className="flex min-h-screen w-full">
        <FcmTokenManager />
        <MainNav />
        <main className="flex-1 flex flex-col bg-background w-full">
          <div className="flex-1 py-4 sm:py-6 lg:py-8 pb-24 md:pb-8">
            {renderView()}
          </div>
        </main>
        {isMobile && <BottomNav />}
      </div>
    </AppViewContext.Provider>
  );
}
