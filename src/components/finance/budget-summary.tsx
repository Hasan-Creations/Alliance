
"use client"

import * as React from "react"
import { useMemo } from "react"
import { TrendingUp, CheckCircle, ShoppingCart, PiggyBank, ChevronLeft, ChevronRight, Wallet } from "lucide-react"
import { Pie, PieChart } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"
import { DonutLabel } from "@/components/ui/donut-chart"
import { format, startOfMonth, isSameMonth, subMonths, addMonths, parseISO } from "date-fns"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Account, Transaction } from "@/lib/types";

const chartConfig = {
  amount: {
    label: "Amount",
  },
  Needs: {
    label: "Needs",
    color: "hsl(var(--chart-1))",
    icon: CheckCircle,
  },
  Wants: {
    label: "Wants",
    color: "hsl(var(--chart-2))",
    icon: ShoppingCart,
  },
};

export function BudgetSummary() {
  const { user } = useUser();
  const firestore = useFirestore();

  const accountsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'accounts');
  }, [firestore, user]);
  const { data: accounts } = useCollection<Account>(accountsRef);

  const transactionsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [firestore, user]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsRef);

  const [activeMonth, setActiveMonth] = React.useState(startOfMonth(new Date()))

  const monthlyData = useMemo(() => {
    if (!transactions || !accounts) return { totalIncome: 0, needsTotal: 0, wantsTotal: 0, savingsTotal: 0, remainingToBudget: 0, chartData: [], totalSpending: 0 };

    const monthlyTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), activeMonth));
    const savingsAccount = accounts.find(a => a.name === 'Savings Account');

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = monthlyTransactions.filter(t => t.type === 'expense');

    const needsTotal = expenses.filter(e => e.subType === 'Need').reduce((acc, e) => acc + e.amount, 0);
    const wantsTotal = expenses.filter(e => e.subType === 'Want').reduce((acc, e) => acc + e.amount, 0);

    // This is the amount transferred TO the savings account this month
    const savingsInflow = monthlyTransactions
      .filter(t => t.type === 'transfer' && t.toAccountId === savingsAccount?.id)
      .reduce((acc, t) => acc + t.amount, 0);

    const totalSpending = needsTotal + wantsTotal;
    const remainingToBudget = totalIncome - totalSpending;
    const savingsTotal = savingsInflow;

    const chartData = [
      { type: "Needs", amount: needsTotal, fill: "var(--color-Needs)" },
      { type: "Wants", amount: wantsTotal, fill: "var(--color-Wants)" },
    ].filter(d => d.amount > 0);

    return { totalIncome, needsTotal, wantsTotal, savingsTotal, remainingToBudget, chartData, totalSpending };
  }, [transactions, activeMonth, accounts]);

  const { totalIncome, remainingToBudget, chartData, totalSpending, wantsTotal, needsTotal, savingsTotal } = monthlyData;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  const goToPreviousMonth = () => {
    setActiveMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setActiveMonth(prev => addMonths(prev, 1));
  };

  if (isLoadingTransactions) {
    return (
      <Card>
        <CardHeader className="p-3">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="p-3 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            <Skeleton className="mx-auto aspect-square w-full max-w-[250px] rounded-full" />
          </div>
          <div className="grid gap-4">
            <Skeleton className="h-20 w-full" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Skeleton className="h-20 w-full" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-20 w-full" />
          </div>
        </CardContent>
        <CardFooter className="p-3">
          <Skeleton className="h-4 w-full max-w-sm" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="p-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Budget Summary</CardTitle>
              <CardDescription>
                Financial breakdown for {format(activeMonth, "MMMM yyyy")}.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={goToNextMonth} disabled={isSameMonth(activeMonth, startOfMonth(new Date()))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-3 grid gap-4 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[250px] min-h-[180px]"
            >
              {totalSpending > 0 ? (
                <PieChart>
                  <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent
                      hideLabel
                      formatter={(value, name, item) => (
                        <div className="flex flex-col">
                          <span className="font-bold">{item.payload.type}</span>
                          <span>{formatCurrency(Number(value))}</span>
                        </div>
                      )}
                    />}
                  />
                  <Pie
                    data={chartData}
                    dataKey="amount"
                    nameKey="type"
                    innerRadius="60%"
                    strokeWidth={5}
                  >
                    <DonutLabel
                      label="Total Spent"
                      value={formatCurrency(totalSpending)}
                    />
                  </Pie>
                </PieChart>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="text-muted-foreground">No spending data for this month.</p>
                </div>
              )}
            </ChartContainer>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Needs</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold">{formatCurrency(needsTotal)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">Wants</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold">{formatCurrency(wantsTotal)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <div className="flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-muted-foreground" />
                  <CardTitle className="text-sm font-medium">To Savings</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-xl font-bold">{formatCurrency(savingsTotal)}</div>
              </CardContent>
            </Card>
            <Card className="col-span-2">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1">
                <CardTitle className="text-sm font-medium">Remaining to Budget</CardTitle>
                <PiggyBank className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent className="p-3 pt-0">
                <div className="text-2xl font-bold">{formatCurrency(remainingToBudget)}</div>
                <p className="text-xs text-muted-foreground">
                  Income - Expenses
                </p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <p className="text-xs text-muted-foreground">This summary is based on your logged transactions for the selected month.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
