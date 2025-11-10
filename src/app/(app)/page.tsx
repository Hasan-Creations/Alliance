'use client';

import React, { useContext, Suspense } from "react";
import dynamic from 'next/dynamic';
import { useSidebar } from "@/components/ui/sidebar";
import { MainNav } from "@/components/main-nav";
import { BottomNav } from "@/components/bottom-nav";
import { Loader2 } from "lucide-react";
import { AppViewContext } from "@/context/app-view-context";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the main views
const DashboardView = dynamic(() => import('@/components/dashboard/dashboard-view').then(mod => mod.DashboardView), {
  loading: () => <ViewSkeleton />,
});
const TodoView = dynamic(() => import('@/components/todos/todo-view').then(mod => mod.TodoView), {
  loading: () => <ViewSkeleton />,
});
const HabitsView = dynamic(() => import('@/components/habits/habits-view').then(mod => mod.HabitsView), {
  loading: () => <ViewSkeleton />,
});
const FinanceView = dynamic(() => import('@/components/finance/finance-view').then(mod => mod.FinanceView), {
  loading: () => <ViewSkeleton />,
});
const SettingsView = dynamic(() => import('@/components/settings/settings-view').then(mod => mod.SettingsView), {
  loading: () => <ViewSkeleton />,
});

function ViewSkeleton() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-4 w-3/4" />
      </div>
      <div className="space-y-4">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    </div>
  );
}


export default function AppPage() {
  const { view } = useContext(AppViewContext);
  
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
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <Suspense fallback={<ViewSkeleton />}>
      {renderView()}
    </Suspense>
  );
}
