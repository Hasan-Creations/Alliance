
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserStartupSettings } from '@/lib/types';

const defaultSettings: UserStartupSettings = {
  startupPage: '/dashboard',
};

const startupOptions = [
  { value: '/dashboard', label: 'Dashboard' },
  { value: '/todos', label: 'To-Do List' },
  { value: '/habits', label: 'Habit Tracker' },
  { value: '/expenses', label: 'Finance Tracker' },
];

export function StartupPreferences() {
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'startup');
  }, [firestore, user]);

  const { data: settings, isLoading } = useDoc<UserStartupSettings>(settingsRef);
  const [localSettings, setLocalSettings] = useState<UserStartupSettings | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    } else if (!isLoading) {
      setLocalSettings(defaultSettings);
    }
  }, [settings, isLoading]);

  const handleSelectChange = (value: string) => {
    if (!settingsRef || !localSettings) return;

    const newSettings = { ...localSettings, startupPage: value };
    setLocalSettings(newSettings);
    setDocumentNonBlocking(settingsRef, newSettings, { merge: true });
  };
  
  if (isLoading || !localSettings) {
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
        <Select value={localSettings.startupPage} onValueChange={handleSelectChange}>
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
