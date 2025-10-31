
'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useUser, useFirestore, useDoc, useMemoFirebase, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserSettings } from '@/lib/types';

const defaultSettings: UserSettings = {
  dailySummary: true,
  taskReminders: true,
  overdueAlerts: true,
  motivationalMessages: false,
};

export function NotificationPreferences() {
  const { user } = useUser();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'notifications');
  }, [firestore, user]);

  const { data: settings, isLoading } = useDoc<UserSettings>(settingsRef);
  const [localSettings, setLocalSettings] = useState<UserSettings | null>(null);

  useEffect(() => {
    if (settings) {
      setLocalSettings(settings);
    } else if (!isLoading) {
      // If loading is finished and there are no settings, initialize with defaults
      setLocalSettings(defaultSettings);
    }
  }, [settings, isLoading]);

  const handleToggle = (key: keyof UserSettings) => {
    if (!settingsRef || !localSettings) return;

    const newSettings = { ...localSettings, [key]: !localSettings[key] };
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
        <CardContent className="space-y-4">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
        <CardDescription>
          Choose which notifications you want to receive.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label htmlFor="daily-summary" className="flex flex-col space-y-1">
            <span>Daily Summary</span>
            <span className="font-normal leading-snug text-muted-foreground">
              A morning summary of your day's tasks.
            </span>
          </Label>
          <Switch
            id="daily-summary"
            checked={localSettings.dailySummary}
            onCheckedChange={() => handleToggle('dailySummary')}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label htmlFor="task-reminders" className="flex flex-col space-y-1">
            <span>Task Reminders</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Reminders for tasks before they are due.
            </span>
          </Label>
          <Switch
            id="task-reminders"
            checked={localSettings.taskReminders}
            onCheckedChange={() => handleToggle('taskReminders')}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label htmlFor="overdue-alerts" className="flex flex-col space-y-1">
            <span>Overdue Alerts</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Alerts for tasks that are past their due date.
            </span>
          </Label>
          <Switch
            id="overdue-alerts"
            checked={localSettings.overdueAlerts}
            onCheckedChange={() => handleToggle('overdueAlerts')}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border p-4">
          <Label htmlFor="motivational-messages" className="flex flex-col space-y-1">
            <span>Motivational Messages</span>
            <span className="font-normal leading-snug text-muted-foreground">
              Occasional messages to keep you going.
            </span>
          </Label>
          <Switch
            id="motivational-messages"
            checked={localSettings.motivationalMessages}
            onCheckedChange={() => handleToggle('motivationalMessages')}
          />
        </div>
      </CardContent>
    </Card>
  );
}
