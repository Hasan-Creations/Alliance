'use client';

import React, { useContext, useEffect, useState } from "react";
import dynamic from 'next/dynamic';
import { AppViewContext } from "@/context/app-view-context";
import { Skeleton } from "@/components/ui/skeleton";

// Dynamically import the main views with SSR disabled
const DashboardView = dynamic(() => import('@/components/dashboard/dashboard-view').then(mod => mod.DashboardView), {
  loading: () => <ViewSkeleton />,
  ssr: false,
});
const TodoView = dynamic(() => import('@/components/todos/todo-view').then(mod => mod.TodoView), {
  loading: () => <ViewSkeleton />,
  ssr: false,
});
const HabitsView = dynamic(() => import('@/components/habits/habits-view').then(mod => mod.HabitsView), {
  loading: () => <ViewSkeleton />,
  ssr: false,
});
const FinanceView = dynamic(() => import('@/components/finance/finance-view').then(mod => mod.FinanceView), {
  loading: () => <ViewSkeleton />,
  ssr: false,
});
const SettingsView = dynamic(() => import('@/components/settings/settings-view').then(mod => mod.SettingsView), {
  loading: () => <ViewSkeleton />,
  ssr: false,
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <ViewSkeleton />;
  }
  
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

  return renderView();
}