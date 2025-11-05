
"use client";

import { useMemo, useContext } from "react";
import { format, startOfMonth, isSameMonth, parseISO } from "date-fns";
import { toZonedTime } from 'date-fns-tz';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Expense, Income } from "@/lib/types";
import { AppViewContext } from "@/app/page";

const chartConfig = {
  value: {
    label: "Amount",
  },
  income: {
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
  expenses: {
    label: "Expenses",
    color: "hsl(var(--chart-1))",
  },
};

export function FinanceSummary() {
  const { setView } = useContext(AppViewContext);
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


  const monthlyData = useMemo(() => {
    if (!incomes || !expenses) return { totalIncome: 0, totalExpenses: 0, chartData: [] };
    const currentMonth = new Date();

    const monthlyIncomes = incomes.filter(i => isSameMonth(parseISO(i.date), currentMonth));
    const monthlyExpenses = expenses.filter(e => isSameMonth(parseISO(e.date), currentMonth));

    const totalIncome = monthlyIncomes.reduce((acc, i) => acc + i.amount, 0);
    const totalExpenses = monthlyExpenses.reduce((acc, e) => acc + e.amount, 0);

    const chartData = [
      { name: "Income", value: totalIncome, fill: "var(--color-income)" },
      { name: "Expenses", value: totalExpenses, fill: "var(--color-expenses)" },
    ];

    return { totalIncome, totalExpenses, chartData };
  }, [expenses, incomes]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
    }).format(value);
  }

  if (isLoadingExpenses || isLoadingIncomes) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
                <Skeleton className="h-48 w-full" />
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Finance Summary</CardTitle>
        <CardDescription>Income vs. Expenses for {format(new Date(), "MMMM yyyy")}</CardDescription>
      </CardHeader>
      <CardContent>
         {monthlyData.totalIncome === 0 && monthlyData.totalExpenses === 0 ? (
          <div className="flex h-48 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center">
            <p className="text-muted-foreground mb-4">No financial data for this month.</p>
            <Button size="sm" onClick={() => setView('expenses')}>
                Add Transaction
            </Button>
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="w-full h-[200px] min-h-[200px]">
            <BarChart accessibilityLayer data={monthlyData.chartData} layout="vertical" margin={{ left: 10, right: 10 }}>
              <XAxis type="number" hide />
              <YAxis 
                type="category" 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{ fill: 'hsl(var(--foreground))', fontSize: 14 }}
              />
              <Tooltip 
                cursor={{ fill: 'hsl(var(--muted))' }}
                content={<ChartTooltipContent formatter={(value) => formatCurrency(Number(value))}/>}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ChartContainer>
        )}
         <Button variant="link" className="px-0 mt-4" onClick={() => setView('expenses')}>
            Go to Finance Tracker <ArrowRight className="ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
