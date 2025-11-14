
"use client";

import { useMemo, useContext } from "react";
import { format, subDays, startOfDay } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from '../ui/button';
import { ArrowRight, Check, X } from "lucide-react";
import { useCollection, useFirestore, useUser, useMemoFirebase } from "@/firebase";
import { collection } from "firebase/firestore";
import type { Habit } from "@/lib/types";
import { AppViewContext } from "@/context/app-view-context";

export function HabitsSummary() {
  const { setView } = useContext(AppViewContext);
  const { user } = useUser();
  const firestore = useFirestore();

  const habitsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'habits');
  }, [firestore, user]);

  const { data: habits, isLoading: isLoadingHabits } = useCollection<Habit>(habitsRef);

  const summaryData = useMemo(() => {
    if (!habits || habits.length === 0) return { completionRate: 0, recentHabits: [] };

    const today = startOfDay(new Date());
    let totalCompletions = 0;
    let totalOpportunities = 0;

    const recentHabits = habits.slice(0, 5).map(habit => {
        const dateStr = format(today, 'yyyy-MM-dd');
        const completion = habit.completions[dateStr];
        const status = completion?.status || 'pending';
        return {
            id: habit.id,
            name: habit.name,
            status: status
        }
    });

    for (let i = 0; i < 7; i++) {
      const date = subDays(today, i);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      habits.forEach(habit => {
        const completion = habit.completions[dateStr];
        if (completion) { // 'completed' or 'missed'
          totalOpportunities++;
          if (completion.status === 'completed') {
            totalCompletions++;
          }
        }
      });
    }
    
    const completionRate = totalOpportunities > 0 ? (totalCompletions / totalOpportunities) * 100 : 0;

    return { completionRate, recentHabits };
  }, [habits]);

  if (isLoadingHabits) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-24 w-full" />
        </CardContent>
      </Card>
    );
  }

  const { completionRate, recentHabits } = summaryData;

  const getStatusIcon = (status: string) => {
    if (status === 'completed') return <Check className="h-4 w-4 text-primary" />;
    if (status === 'missed') return <X className="h-4 w-4 text-destructive" />;
    return <div className="h-4 w-4" />;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Habits Summary</CardTitle>
        <CardDescription>Your habit performance for today.</CardDescription>
      </CardHeader>
      <CardContent>
        {!habits || habits.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center rounded-lg border-2 border-dashed text-center">
            <p className="text-muted-foreground mb-4">No habits are being tracked.</p>
            <Button size="sm" onClick={() => setView('habits')}>
                Add a Habit
            </Button>
          </div>
        ) : (
            <div className="space-y-4">
                 <div className="text-center">
                    <p className="text-sm text-muted-foreground">Last 7 Days Completion Rate</p>
                    <p className="text-3xl font-bold">{completionRate.toFixed(0)}%</p>
                </div>
                <div>
                    <h4 className="font-medium text-sm mb-2">Today's Habits:</h4>
                    <ul className="space-y-2">
                        {recentHabits.map(habit => (
                           <li key={habit.id} className="flex items-center justify-between text-sm p-2 rounded-md bg-muted/50">
                               <span>{habit.name}</span>
                               {getStatusIcon(habit.status)}
                           </li>
                        ))}
                    </ul>
                </div>
            </div>
        )}
        <Button variant="link" className="px-0 mt-4" onClick={() => setView('habits')}>
            Go to Habit Tracker <ArrowRight className="ml-2" />
        </Button>
      </CardContent>
    </Card>
  );
}
