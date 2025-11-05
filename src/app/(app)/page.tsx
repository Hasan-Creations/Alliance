
'use client';

import { useContext } from 'react';
import { AppViewContext } from '@/context/app-view-context';
import { DashboardView } from '@/components/dashboard/dashboard-view';
import { TodoView } from '@/components/todos/todo-view';
import { HabitsView } from '@/components/habits/habits-view';
import { FinanceView } from '@/components/finance/finance-view';
import { SettingsView } from '@/components/settings/settings-view';

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
            case 'expenses':
                return <FinanceView />;
            case 'settings':
                return <SettingsView />;
            default:
                return <DashboardView />;
        }
    };

    return <>{renderView()}</>;
}
