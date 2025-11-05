
'use client';

import { useEffect, useState, useContext } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserStartupSettings } from '@/lib/types';
import { AppViewContext, type View } from '@/app/page';

const defaultSettings: UserStartupSettings = {
  startupPage: 'dashboard',
};

const startupOptions: { value: View, label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'todos', label: 'To-Do List' },
  { value: 'habits', label: 'Habit Tracker' },
  { value: 'expenses', label: 'Finance Tracker' },
];

export function StartupPreferences() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { setView } = useContext(AppViewContext);

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'startup');
  }, [firestore, user]);

  const { data: settings, isLoading } = useDoc<UserStartupSettings>(settingsRef);
  
  const [selectedPage, setSelectedPage] = useState<View>('dashboard');

  useEffect(() => {
    if (settings) {
      setSelectedPage(settings.startupPage as View);
    } else if (!isLoading) {
      setSelectedPage(defaultSettings.startupPage as View);
    }
  }, [settings, isLoading]);

  const handleSelectChange = (value: string) => {
    if (!settingsRef) return;
    const newStartupPage = value as View;
    setSelectedPage(newStartupPage);
    setDocumentNonBlocking(settingsRef, { startupPage: newStartupPage }, { merge: true });
  };
  
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Startup Preferences</CardTitle>
        <CardDescription>
          Choose which page you want to see when you open the app.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <Label htmlFor="startup-page">Default Startup Page</Label>
        <Select value={selectedPage} onValueChange={handleSelectChange}>
          <SelectTrigger id="startup-page">
            <SelectValue placeholder="Select a page" />
          </SelectTrigger>
          <SelectContent>
            {startupOptions.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  );
}
