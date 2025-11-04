
"use client";

import { ExpensesView } from "@/components/expenses/expenses-view";
import { IncomesView } from "@/components/finance/incomes-view";
import { BudgetSummary } from "@/components/finance/budget-summary";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export function FinanceView() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Finance Tracker</h1>
        <p className="text-muted-foreground">Track your expenses and income, manage your budget.</p>
      </div>
      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="income">Income</TabsTrigger>
        </TabsList>
        <TabsContent value="summary">
            <BudgetSummary />
        </TabsContent>
        <TabsContent value="expenses">
          <ExpensesView />
        </TabsContent>
        <TabsContent value="income">
          <IncomesView />
        </TabsContent>
      </Tabs>
    </div>
  );
}
