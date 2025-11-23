'use client';

import { useNotifications } from '@/hooks/use-notifications';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, BellOff, RefreshCw } from 'lucide-react';
import { Skeleton } from '../ui/skeleton';

interface NotificationsSettingsProps {
  compact?: boolean;
}

export function NotificationsSettings({ compact = false }: NotificationsSettingsProps) {
  const { permission, requestPermission, isSupported, currentToken, deleteCurrentToken } = useNotifications();

  const renderStatus = () => {
    if (!isSupported) {
      return (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <BellOff className="h-4 w-4" />
          <span>Notifications are not supported on this browser.</span>
        </div>
      );
    }
    
    if (permission === 'default' && !currentToken) {
        return (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg">
                <p className="text-sm text-muted-foreground">Enable push notifications</p>
                <Button onClick={requestPermission} size="sm">Enable</Button>
            </div>
        );
    }

    if (permission === 'granted') {
      return (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 border rounded-lg bg-muted/40">
            <div className="flex items-center gap-2 text-sm text-green-600">
                <Bell className="h-4 w-4" />
                <span>Notifications enabled</span>
            </div>
            <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={requestPermission} title="Re-sync Token">
                    <RefreshCw className="h-4 w-4" />
                </Button>
                <Button variant="destructive" size="sm" onClick={deleteCurrentToken}>
                    <BellOff className="h-4 w-4 mr-1"/> Disable
                </Button>
            </div>
        </div>
      );
    }

    if (permission === 'denied') {
        return (
            <div className="flex items-center gap-2 text-sm text-destructive p-3 border border-destructive/50 rounded-lg">
                <BellOff className="h-4 w-4" />
                <span>Notifications are blocked. Enable in browser settings.</span>
            </div>
        );
    }

    // Fallback / Loading state
    return compact ? <Skeleton className="h-20 w-full" /> : <Skeleton className="h-12 w-full" />;
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {renderStatus()}
      </div>
    );
  }

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