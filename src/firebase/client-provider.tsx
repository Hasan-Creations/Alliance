'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from './provider';
import { initializeFirebase } from '@/firebase';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export const FirebaseClientProvider: React.FC<FirebaseClientProviderProps> = ({ children }) => {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase once on client mount
    return initializeFirebase();
  }, []); // Runs only once

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
    >
      {children}
    </FirebaseProvider>
  );
};
