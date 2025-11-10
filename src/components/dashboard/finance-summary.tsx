
"use client";

import { useMemo, useContext } from "react";
import { format, isSameMonth } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Transaction } from "@/lib/types";
import { AppViewContext } from "@/context/app-view-context";
import { parseISO } from "date-fns";

const chartConfig = {
  value: {
    label: "Amount",
  },
  income: {
    label: "Income",
    color: "hsl(var(--chart-2))",
  },
  expense: {
    label: "Expenses",
    color: "hsl(var(--chart-1))",
  },
};

export function FinanceSummary() {
  const { setView } = useContext(AppViewContext);
  const { user } = useUser();
  const firestore = useFirestore();

  const transactionsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'transactions');
  }, [firestore, user]);
  const { data: transactions, isLoading: isLoadingTransactions } = useCollection<Transaction>(transactionsRef);

  const monthlyData = useMemo(() => {
    if (!transactions) return { totalIncome: 0, totalExpenses: 0, chartData: [] };
    const currentMonth = new Date();

    const monthlyTransactions = transactions.filter(t => isSameMonth(parseISO(t.date), currentMonth));

    const totalIncome = monthlyTransactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenses = monthlyTransactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const chartData = [
      { name: "Income", value: totalIncome, fill: "var(--color-income)" },
      { name: "Expenses", value: totalExpenses, fill: "var(--color-expense)" },
    ];

    return { totalIncome, totalExpenses, chartData };
  }, [transactions]);
  
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  }

  if (isLoadingTransactions) {
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
            <Button size="sm" onClick={() => setView('finance')}>
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
         <Button variant="link" className="px-0 mt-4" onClick={() => setView('finance')}>
            Go to Finance Tracker <ArrowRight className="ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
