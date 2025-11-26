
"use client";

import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountsManager } from "@/components/finance/accounts-manager";
import { BudgetSummary } from "@/components/finance/budget-summary";
import { TransactionsView } from "@/components/finance/transactions-view";

export const FinanceView = React.memo(function FinanceView() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Finance Tracker</h1>
        <p className="text-muted-foreground">Track your transactions and manage your budget.</p>
      </div>

      <Tabs defaultValue="summary">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary">Summary</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
        </TabsList>
        <TabsContent value="summary" className="space-y-6">
           <AccountsManager />
           <BudgetSummary />
        </TabsContent>
        <TabsContent value="transactions">
           <TransactionsView />
        </TabsContent>
      </Tabs>
    </div>
  );
});
FinanceView.displayName = 'FinanceView';

