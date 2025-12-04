
'use client';

import React, { useContext } from "react";
import { SidebarProvider, useSidebar } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { BottomNav } from "@/components/bottom-nav";
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { TodoView } from '@/components/todos/todo-view';
import { HabitsView } from '@/components/habits/habits-view';
import { FinanceView } from '@/components/finance/finance-view';
import { SettingsView } from '@/components/settings/settings-view';
import { NotesView } from "@/components/notes/notes-view";
import { AppViewContext, AppViewContextProvider } from "@/context/app-view-context";
import { FirebaseMessagingListener } from '@/components/FirebaseMessagingListener';
import { NotificationPrompter } from '@/components/NotificationPrompter';

function CurrentView() {
    const { view } = useContext(AppViewContext);
    const { isMobile } = useSidebar();
    
    const renderView = () => {
        switch (view) {
        case 'dashboard':
            return <DashboardView />;
        case 'todos':
            return <TodoView />;
        case 'habits':
            return <HabitsView />;
        case 'finance':
            return <FinanceView />;
        case 'notes':
            return <NotesView />;
        case 'settings':
            return <SettingsView />;
        default:
            return <DashboardView />;
        }
    };

    return (
        <div className="flex min-h-screen w-full">
            <FirebaseMessagingListener />
            <NotificationPrompter />
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


export const AppLayout = React.memo(function AppLayout() {
  return (
    <SidebarProvider>
      <AppViewContextProvider>
        <CurrentView />
      </AppViewContextProvider>
    </SidebarProvider>
  );
});
