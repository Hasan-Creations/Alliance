
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser, useDoc, useFirestore, useMemoFirebase } from '@/firebase';
import WelcomePage from "./welcome/page";
import { Loader2 } from 'lucide-react';
import { doc } from 'firebase/firestore';
import type { UserStartupSettings } from "@/lib/types";


export default function RootRedirect() {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const firestore = useFirestore();

  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'startup');
  }, [firestore, user]);

  const { data: startupSettings, isLoading: isLoadingSettings } = useDoc<UserStartupSettings>(settingsRef);

  useEffect(() => {
    // Wait until both user and their settings have finished loading
    if (!isUserLoading && !isLoadingSettings) {
      if (user) {
        // If the user is logged in, redirect them to their chosen startup page.
        // Default to /dashboard if no setting is saved.
        const startupPage = startupSettings?.startupPage || '/dashboard';
        router.replace(startupPage);
      }
      // If there's no user, the page will proceed to render the WelcomePage.
    }
  }, [user, isUserLoading, startupSettings, isLoadingSettings, router]);

  // Show a loading spinner while checking auth state or settings.
  // Or if a user exists and we are waiting for the redirect to happen.
  if (isUserLoading || isLoadingSettings || user) {
    return (
      <div className="flex min-h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // If not loading and no user, show the public-facing welcome page.
  return <WelcomePage />;
}
