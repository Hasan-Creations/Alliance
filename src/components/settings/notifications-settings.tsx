'use client';

import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff } from 'lucide-react';

export function NotificationsSettings() {
  const { permission, requestPermission, isSupported } = useNotifications();

  const renderStatus = () => {
    if (!isSupported) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <BellOff className="h-4 w-4" />
            <span>Notifications are not supported on this browser.</span>
        </div>
      );
    }

    switch (permission) {
      case 'granted':
        return (
            <div className="flex items-center gap-2 text-sm text-green-600">
                <Bell className="h-4 w-4" />
                <span>You will receive notifications.</span>
            </div>
        );
      case 'denied':
        return (
            <div className="flex items-center gap-2 text-sm text-destructive">
                <BellOff className="h-4 w-4" />
                <span>Notifications are blocked. You need to enable them in your browser settings.</span>
            </div>
        );
      default:
        return (
            <div className="flex items-center justify-between gap-4 p-4 border rounded-lg">
                <p className="text-sm text-muted-foreground">Enable push notifications to get timely reminders and updates.</p>
                <Button onClick={requestPermission}>Enable Notifications</Button>
            </div>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications</CardTitle>
        <CardDescription>
          Manage how you receive notifications from Alliance.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {renderStatus()}
      </CardContent>
    </Card>
  );
}
