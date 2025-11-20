"use client";

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StartupPreferences } from './startup-preferences';
import { DataExporter } from './data-exporter';
import { NotificationsSettings } from './notifications-settings';

export const SettingsView = React.memo(function SettingsView() {
  const auth = useAuth();
  const { user } = useUser();
  const router = useRouter();

  const handleSignOut = useCallback(async () => {
    if (auth) {
        await auth.signOut();
    }
    router.push('/login');
  }, [auth, router]);

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold font-headline">Settings</h1>
        <p className="text-muted-foreground">Manage your application settings.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            Manage your account settings and sign out.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 border rounded-lg flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <p className="font-medium">{user?.displayName ?? 'Anonymous User'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                </div>
                <Button onClick={handleSignOut} variant="outline">
                    <LogOut className="mr-2 h-4 w-4" />
                    Sign Out
                </Button>
            </div>
        </CardContent>
      </Card>

      <NotificationsSettings />

      <StartupPreferences />

      <DataExporter />
    </div>
  );
});
