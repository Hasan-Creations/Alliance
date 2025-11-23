"use client";

import React from 'react';
import { FinanceSummary } from "./finance-summary";
import { HabitsSummary } from "./habits-summary";
import { TodoSummary } from "./todo-summary";

export const DashboardView = React.memo(function DashboardView() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
       <div>
        <h1 className="text-3xl font-bold font-headline">Dashboard</h1>
        <p className="text-muted-foreground">A quick overview of your tasks, habits, and finances.</p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <TodoSummary />
        <HabitsSummary />
        <FinanceSummary />
      </div>
    </div>
  );
});
DashboardView.displayName = 'DashboardView';
