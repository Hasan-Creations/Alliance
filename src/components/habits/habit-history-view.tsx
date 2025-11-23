
"use client"

import React, { useState } from "react"
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameMonth, isToday } from "date-fns"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Habit, HabitCompletionStatus } from "@/lib/types"
import { Skeleton } from "../ui/skeleton"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface HabitHistoryViewProps {
    habits: Habit[];
    isLoading: boolean;
}

const DayHeader = () => (
    <div className="grid grid-cols-7 text-xs text-muted-foreground">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => <div key={i} className="w-8 h-8 flex items-center justify-center">{d}</div>)}
    </div>
);

const HabitCalendar = ({ habit }: { habit: Habit }) => {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const daysInMonth = eachDayOfInterval({
    start: currentMonth,
    end: endOfMonth(currentMonth),
  });

  const firstDayOfMonth = getDay(currentMonth); // 0 for Sunday, 1 for Monday, etc.

  const getStatusColor = (status: HabitCompletionStatus) => {
    switch (status) {
      case 'completed': return 'bg-primary text-primary-foreground';
      case 'missed': return 'bg-destructive/50';
      default: return 'bg-muted/50';
    }
  };

  return (
    <div className="p-3 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-semibold">{habit.name}</h4>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium w-24 text-center">{format(currentMonth, "MMM yyyy")}</span>
          <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} disabled={isSameMonth(currentMonth, new Date())}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <DayHeader />
      <div className="grid grid-cols-7">
        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} className="w-8 h-8" />
        ))}
        {daysInMonth.map(day => {
          const dateStr = format(day, "yyyy-MM-dd");
          const completion = habit.completions[dateStr];
          const status = completion?.status;
          return (
            <div
              key={dateStr}
              title={format(day, 'PPP')}
              className={cn(
                "w-8 h-8 flex items-center justify-center rounded text-xs",
                status && getStatusColor(status),
                isToday(day) && "ring-2 ring-ring ring-offset-2 ring-offset-background",
              )}
            >
              {format(day, 'd')}
            </div>
          );
        })}
      </div>
    </div>
  );
};


export function HabitHistoryView({ habits, isLoading }: HabitHistoryViewProps) {
  return (
    <Card>
      <CardHeader className="p-3">
        <CardTitle>Habit History</CardTitle>
        <CardDescription>Review your consistency with a compact heat map view.</CardDescription>
      </CardHeader>
      <CardContent className="p-3">
        {isLoading ? (
            <Skeleton className="h-48 w-full" />
        ) : habits.length === 0 ? (
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">No habits to display history for.</p>
          </div>
        ) : (
          <Accordion type="single" collapsible className="w-full">
            {habits.map(habit => (
               <AccordionItem value={habit.id} key={habit.id}>
                <AccordionTrigger>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">{habit.name}</span>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                    <HabitCalendar habit={habit} />
                </AccordionContent>
            </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  )
}
