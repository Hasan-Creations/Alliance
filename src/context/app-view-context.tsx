
'use client';

import React, { createContext, useState, useContext, ReactNode, useEffect } from 'react';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import type { UserStartupSettings } from '@/lib/types';

export type View = 'dashboard' | 'todos' | 'habits' | 'expenses' | 'settings';

export const AppViewContext = createContext<{
  view: View;
  setView: (view: View) => void;
}>({
  view: 'dashboard',
  setView: () => {},
});

export const AppViewContextProvider = ({ children }: { children: ReactNode }) => {
  const [view, setView] = useState<View>('dashboard');
  const { user } = useUser();
  const firestore = useFirestore();
  
  const settingsRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid, 'settings', 'startup');
  }, [firestore, user]);

  const { data: startupSettings, isLoading } = useDoc<UserStartupSettings>(settingsRef);

  useEffect(() => {
    // When the app loads and we have the startup settings, set the initial view.
    // We check !isLoading to ensure we have a definitive answer from Firestore.
    if (startupSettings && !isLoading) {
      setView(startupSettings.startupPage as View);
    } else if (!startupSettings && !isLoading) {
      // If no settings exist, default to dashboard.
      setView('dashboard');
    }
    // This effect should only run when the settings are loaded or change.
  }, [startupSettings, isLoading]);

  return (
    <AppViewContext.Provider value={{ view, setView }}>
      {children}
    </AppViewContext.Provider>
  );
};
