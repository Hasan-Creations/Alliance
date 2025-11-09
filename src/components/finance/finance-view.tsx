"use client";

import { AccountsManager } from "@/components/finance/accounts-manager";
import { BudgetSummary } from "@/components/finance/budget-summary";
import { TransactionsView } from "@/components/finance/transactions-view";

export function FinanceView() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Finance Tracker</h1>
        <p className="text-muted-foreground">Track your transactions and manage your budget.</p>
      </div>
      <AccountsManager />
      <BudgetSummary />
      <TransactionsView />
    </div>
  );
}
