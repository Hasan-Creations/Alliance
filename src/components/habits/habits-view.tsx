
"use client";

import React, { useState, useCallback, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from '../ui/skeleton';
import { HabitHistoryView } from './habit-history-view';
import type { Habit } from '@/lib/types';
import { useCollection, useFirestore, useUser, useMemoFirebase, addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase";
import { collection, doc } from "firebase/firestore";

export const HabitsView = React.memo(function HabitsView() {
  const { user } = useUser();
  const firestore = useFirestore();

  const habitsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, 'users', user.uid, 'habits');
  }, [firestore, user]);

  const { data: habits, isLoading: isLoadingHabits } = useCollection<Habit>(habitsRef);
  
  const [newHabitName, setNewHabitName] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [habitToDelete, setHabitToDelete] = useState<Habit | null>(null);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const addHabit = useCallback((name: string) => {
    if (!habitsRef) return;
    addDocumentNonBlocking(habitsRef, { 
      name, 
      completions: {},
      createdAt: Date.now(),
    });
  }, [habitsRef]);

  const deleteHabit = useCallback((id: string) => {
    if (!firestore || !user) return;
    const docRef = doc(firestore, 'users', user.uid, 'habits', id);
    deleteDocumentNonBlocking(docRef);
  }, [firestore, user]);

  const toggleHabitCompletion = useCallback((id: string, date: string) => {
    if (!firestore || !user || !habits) return;
    const habit = habits.find(h => h.id === id);
    if (!habit) return;

    const docRef = doc(firestore, 'users', user.uid, 'habits', id);
    const newCompletions = { ...habit.completions };

    const currentCompletion = newCompletions[date];

    if (currentCompletion?.status === 'completed') {
      delete newCompletions[date]; // Set back to pending
    } else {
      newCompletions[date] = { status: 'completed', timestamp: Date.now() }; // Set to completed
    }

    updateDocumentNonBlocking(docRef, { completions: newCompletions });
  }, [firestore, user, habits]);

  const handleAddHabit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (newHabitName.trim()) {
      addHabit(newHabitName.trim());
      setNewHabitName('');
      setIsAddDialogOpen(false);
    }
  }, [addHabit, newHabitName]);

  const handleConfirmDelete = useCallback(() => {
    if(habitToDelete) {
        deleteHabit(habitToDelete.id);
    }
    setHabitToDelete(null);
    setIsDeleteDialogOpen(false);
  }, [habitToDelete, deleteHabit]);
  
  const openDeleteDialog = useCallback((habit: Habit) => {
    setHabitToDelete(habit);
    setIsDeleteDialogOpen(true);
  }, []);

  const sortedHabits = useMemo(() => {
    if (!habits) return [];
    return [...habits].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
  }, [habits]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold font-headline">Habit Tracker</h1>
          <p className="text-muted-foreground">
            What did you accomplish today, {format(new Date(), 'MMMM d')}?
          </p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> Add Habit
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a New Habit</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAddHabit}>
              <div className="py-4">
                  <Input
                    placeholder="e.g., Read for 15 minutes"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                  />
              </div>
              <DialogFooter className="grid grid-cols-2 gap-2">
                <DialogClose asChild><Button type="button" variant="outline">Cancel</Button></DialogClose>
                <Button type="submit">Add Habit</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardContent className="pt-6">
          {isLoadingHabits ? (
             <div className="grid grid-cols-2 gap-4">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
             </div>
          ) : !sortedHabits || sortedHabits.length === 0 ? (
             <div className="h-48 flex items-center justify-center text-center text-muted-foreground">
                <p>No habits yet. Add one to get started!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-4 gap-y-2">
              {sortedHabits.map((habit) => {
                const isCompleted = habit.completions[todayStr]?.status === 'completed';
                return (
                  <div key={habit.id} className="flex items-center justify-between">
                    <div className="flex items-center flex-1 min-w-0">
                      <Checkbox
                          id={`habit-${habit.id}`}
                          checked={isCompleted}
                          onCheckedChange={() => toggleHabitCompletion(habit.id, todayStr)}
                          className="mr-2"
                      />
                      <Label 
                          htmlFor={`habit-${habit.id}`}
                          className="font-normal text-sm flex-1 truncate"
                      >
                          {habit.name}
                      </Label>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-6 w-6 ml-2 text-muted-foreground hover:text-destructive"
                      onClick={() => openDeleteDialog(habit)}
                    >
                        <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <HabitHistoryView habits={sortedHabits ?? []} isLoading={isLoadingHabits} />

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete '{habitToDelete?.name}'?</DialogTitle>
            <DialogDescription>This will permanently delete the habit and all its history. This action cannot be undone.</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild><Button variant="outline">Cancel</Button></DialogClose>
            <Button variant="destructive" onClick={handleConfirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
});
