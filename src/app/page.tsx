
'use client';

import React, { useContext } from "react";
import { useSidebar } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { BottomNav } from "@/components/bottom-nav";
import { useUser } from "@/firebase";
import { Loader2 } from "lucide-react";
import { FcmTokenManager } from "@/components/FcmTokenManager";
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { TodoView } from '@/components/todos/todo-view';
import { HabitsView } from '@/components/habits/habits-view';
import { FinanceView } from '@/components/finance/finance-view';
import { SettingsView } from '@/components/settings/settings-view';
import WelcomePage from "./welcome/page";
import { AppViewContext, type View } from "@/context/app-view-context";

export default function AppPage() {
  const { user, isUserLoading } = useUser();
  const { view } = useContext(AppViewContext);
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
  );
}
