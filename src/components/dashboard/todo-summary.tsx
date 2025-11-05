
"use client";

import { useMemo, useContext } from "react";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ChartContainer, ChartTooltipContent } from "@/components/ui/chart";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '../ui/button';
import { ArrowRight } from 'lucide-react';
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Task } from "@/lib/types";
import { AppViewContext } from "@/app/page";

const chartConfig = {
  completed: {
    label: "Completed",
    color: "hsl(var(--chart-2))",
  },
  pending: {
    label: "Pending",
    color: "hsl(var(--muted))",
  },
};

export function TodoSummary() {
  const { setView } = useContext(AppViewContext);
  const { user } = useUser();
  const firestore = useFirestore();
  
  const tasksRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'tasks');
  }, [firestore, user]);
  
  const { data: tasks, isLoading: isLoadingTasks } = useCollection<Task>(tasksRef);

  const summaryData = useMemo(() => {
    if (!tasks) return { totalTasks: 0, completedTasks: 0, pendingTasks: 0, chartData: [] };

    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = tasks.length - completedTasks;
    
    const chartData = [
      { name: "Completed", value: completedTasks, fill: "var(--color-completed)" },
      { name: "Pending", value: pendingTasks, fill: "var(--color-pending)" },
    ].filter(item => item.value > 0);

    return {
      totalTasks: tasks.length,
      completedTasks,
      pendingTasks,
      chartData,
    };
  }, [tasks]);

  if (isLoadingTasks) {
    return (
        <Card>
            <CardHeader>
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent className="flex items-center gap-4">
                <Skeleton className="h-24 w-24 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-full" />
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>To-Do Summary</CardTitle>
        <CardDescription>You have {summaryData.pendingTasks} pending tasks.</CardDescription>
      </CardHeader>
      <CardContent>
        {summaryData.totalTasks === 0 ? (
           <div className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center">
            <p className="text-muted-foreground mb-4">No tasks yet. Add one to get started!</p>
             <Button size="sm" onClick={() => setView('todos')}>
                Add Task
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
            <ChartContainer config={chartConfig} className="w-24 h-24 min-w-24">
              <PieChart accessibilityLayer>
                <Pie
                  data={summaryData.chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  innerRadius={28}
                  outerRadius={40}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {summaryData.chartData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Pie>
                 <Tooltip
                   content={<ChartTooltipContent hideLabel nameKey="name" />}
                />
              </PieChart>
            </ChartContainer>
            <div className="flex-1 space-y-1 text-sm">
                <p>Total Tasks: <strong>{summaryData.totalTasks}</strong></p>
                <p>Completed: <strong>{summaryData.completedTasks}</strong></p>
                <p>Pending: <strong>{summaryData.pendingTasks}</strong></p>
            </div>
          </div>
        )}
         <Button variant="link" className="px-0 mt-4" onClick={() => setView('todos')}>
            Go to To-Do List <ArrowRight className="ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
