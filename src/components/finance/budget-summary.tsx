
"use client"

import * as React from "react"
import { useMemo } from "react"
import { TrendingUp, CheckCircle, ShoppingCart, PiggyBank, ChevronLeft, ChevronRight } from "lucide-react"
import { Donut, DonutChart, DonutLabel } from "@/components/ui/donut-chart"
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
import { format, startOfMonth, isSameMonth, subMonths, addMonths, parseISO } from "date-fns"
import { toZonedTime } from 'date-fns-tz';
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Expense, Income } from "@/lib/types";

export function BudgetSummary() {
  const { user } = useUser();
  const firestore = useFirestore();

  const expensesRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'expenses');
  }, [firestore, user]);
  const { data: expenses, isLoading: isLoadingExpenses } = useCollection<Expense>(expensesRef);

  const incomesRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'incomes');
  }, [firestore, user]);
  const { data: incomes, isLoading: isLoadingIncomes } = useCollection<Income>(incomesRef);


  const [activeMonth, setActiveMonth] = React.useState(startOfMonth(new Date()))

  const monthlyData = useMemo(() => {
    if (!incomes || !expenses) return { totalIncome: 0, needsTotal: 0, wantsTotal: 0, savingsTotal: 0, remaining: 0, chartData: [], totalSpending: 0, totalAllocated: 0 };
    
    const monthlyIncomes = incomes.filter(i => isSameMonth(parseISO(i.date), activeMonth));
    const monthlyExpenses = expenses.filter(e => isSameMonth(parseISO(e.date), activeMonth));

    const totalIncome = monthlyIncomes.reduce((acc, i) => acc + i.amount, 0);
    
    const needsTotal = monthlyExpenses.filter(e => e.type === 'Need').reduce((acc, e) => acc + e.amount, 0);
    const wantsTotal = monthlyExpenses.filter(e => e.type === 'Want').reduce((acc, e) => acc + e.amount, 0);
    const savingsTotal = monthlyExpenses.filter(e => e.type === 'Savings').reduce((acc, e) => acc + e.amount, 0);

    const totalSpending = needsTotal + wantsTotal;
    const totalAllocated = needsTotal + wantsTotal + savingsTotal;

    const remaining = totalIncome - totalAllocated;

    const chartData = [
      { type: "Needs", amount: needsTotal, fill: "hsl(var(--chart-1))" },
      { type: "Wants", amount: wantsTotal, fill: "hsl(var(--chart-2))" },
      { type: "Savings", amount: savingsTotal, fill: "hsl(var(--chart-3))" },
    ].filter(d => d.amount > 0);

    return { totalIncome, needsTotal, wantsTotal, savingsTotal, remaining, chartData, totalSpending, totalAllocated };
  }, [expenses, incomes, activeMonth]);

  const { totalIncome, remaining, chartData, totalSpending, totalAllocated } = monthlyData;

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
    Savings: {
      label: "Savings",
      color: "hsl(var(--chart-3))",
      icon: PiggyBank,
    },
  };
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(value);
  }

  const goToPreviousMonth = () => {
    setActiveMonth(prev => subMonths(prev, 1));
  };

  const goToNextMonth = () => {
    setActiveMonth(prev => addMonths(prev, 1));
  };


  if (isLoadingExpenses || isLoadingIncomes) {
    return (
      <Card>
        <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
        </CardHeader>
        <CardContent className="grid gap-6 md:grid-cols-2">
            <div className="flex flex-col justify-center">
                <Skeleton className="mx-auto aspect-square w-full max-w-[300px] rounded-full" />
            </div>
            <div className="grid gap-4">
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                </div>
                <Skeleton className="h-24 w-full" />
            </div>
        </CardContent>
         <CardFooter>
            <Skeleton className="h-4 w-full max-w-sm" />
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
              <div>
                <CardTitle>Budget Summary</CardTitle>
                <CardDescription>
                  Your financial breakdown for {format(activeMonth, "MMMM yyyy")}.
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
        <CardContent className="grid gap-6 md:grid-cols-2">
          <div className="flex flex-col justify-center">
            <ChartContainer
              config={chartConfig}
              className="mx-auto aspect-square max-h-[300px] min-h-[200px]"
            >
             {totalAllocated > 0 ? (
                <DonutChart data={chartData} dataKey="amount" nameKey="type" config={chartConfig}>
                    <Donut>
                      <DonutLabel
                          label="Total Spent"
                          value={formatCurrency(totalSpending)}
                      />
                    </Donut>
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
                </DonutChart>
              ) : (
                <div className="flex h-full w-full items-center justify-center rounded-lg border-2 border-dashed">
                  <p className="text-muted-foreground">Not enough data to display chart.</p>
                </div>
              )}
            </ChartContainer>
          </div>
          <div className="grid gap-4">
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Income</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(totalIncome)}</div>
                </CardContent>
             </Card>
             <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
               {Object.values(chartConfig).filter(c => c.label !== 'Amount').map(({ label, icon: Icon, color }) => {
                 const amount = chartData.find(d => d.type === label)?.amount || 0;
                 return (
                    <Card key={label} className="flex flex-col">
                      <CardHeader className="pb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: color}}/>
                          <CardTitle className="text-sm font-medium">{label as string}</CardTitle>
                        </div>
                      </CardHeader>
                      <CardContent className="flex-1 flex items-end">
                        <div className="text-xl font-bold">{formatCurrency(amount)}</div>
                      </CardContent>
                    </Card>
                 )
               })}
             </div>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Remaining to Budget</CardTitle>
                    <PiggyBank className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{formatCurrency(remaining)}</div>
                    <p className="text-xs text-muted-foreground">
                        {formatCurrency(totalIncome)} (Income) - {formatCurrency(totalAllocated)} (Allocated)
                    </p>
                </CardContent>
             </Card>
          </div>
        </CardContent>
        <CardFooter>
            <p className="text-xs text-muted-foreground">This summary is based on your logged income and expenses for the selected month.</p>
        </CardFooter>
      </Card>
    </div>
  )
}
