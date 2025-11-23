"use client";

import React, { useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth, useUser } from '@/firebase';
import { LogOut, User, Bell, Rocket, Download, Palette } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { StartupPreferences } from './startup-preferences';
import { DataExporter } from './data-exporter';
import { NotificationsSettings } from './notifications-settings';
import { deleteTokenFromFirestore, useNotifications } from '@/hooks/use-notifications';
import { useFirestore } from '@/firebase';
import { ThemeToggle } from './theme-toggle';

export const SettingsView = React.memo(function SettingsView() {
  const auth = useAuth();
  const { user } = useUser();
  const firestore = useFirestore();
  const router = useRouter();
  const { currentToken } = useNotifications();

  const handleSignOut = useCallback(async () => {
    if (auth && user && firestore) {
      try {
        if (currentToken) {
          await deleteTokenFromFirestore(user.uid, firestore, currentToken);
        }
      } catch (error) {
        console.error("Could not delete FCM token on sign out:", error);
      } finally {
        await auth.signOut();
        router.push('/login');
      }
    } else if (auth) {
        await auth.signOut();
        router.push('/login');
    }
  }, [auth, user, firestore, router, currentToken]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold font-headline">Settings</h1>
          <p className="text-sm text-muted-foreground">Manage your application preferences</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Account Card */}
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-3">
          <div className="flex items-center space-x-2">
            <User className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Account</CardTitle>
          </div>
          <CardDescription className="text-sm">
            {user?.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full">
            <LogOut className="mr-2 h-4 w-4" />
            Sign Out
          </Button>
        </CardContent>
      </Card>

      {/* Compact Settings Sections */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Notifications */}
        <Card className="border-l-4 border-l-accent">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Bell className="h-5 w-5 text-accent" />
              <CardTitle className="text-lg">Notifications</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <NotificationsSettings compact />
          </CardContent>
        </Card>

        {/* Startup Preferences */}
        <Card className="border-l-4 border-l-chart-1">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Rocket className="h-5 w-5 text-chart-1" />
              <CardTitle className="text-lg">Startup</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <StartupPreferences compact />
          </CardContent>
        </Card>

        {/* Data Export */}
        <Card className="border-l-4 border-l-chart-2 md:col-span-2">
          <CardHeader className="pb-3">
            <div className="flex items-center space-x-2">
              <Download className="h-5 w-5 text-chart-2" />
              <CardTitle className="text-lg">Data</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <DataExporter compact />
          </CardContent>
        </Card>
      </div>
    </div>
  );
});
SettingsView.displayName = 'SettingsView';
