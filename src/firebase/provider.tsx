'use client';

import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { Auth, onAuthStateChanged, User } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

// -----------------------------
// Types
// -----------------------------
export interface FirebaseContextValue {
  firebaseApp: any;
  auth: Auth;
  firestore: Firestore;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

interface FirebaseProviderProps {
  firebaseApp: any;
  auth: Auth;
  firestore: Firestore;
  children: ReactNode;
}

export type UserHookResult = {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
};

// -----------------------------
// Context setup
// -----------------------------
const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export const FirebaseProvider = ({
  firebaseApp,
  auth,
  firestore,
  children,
}: FirebaseProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);
  const [userError, setUserError] = useState<Error | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (firebaseUser) => {
        setUser(firebaseUser);
        setIsUserLoading(false);
      },
      (error) => {
        setUserError(error);
        setIsUserLoading(false);
      }
    );

    return () => unsubscribe();
  }, [auth]);

  const value: FirebaseContextValue = {
    firebaseApp,
    auth,
    firestore,
    user,
    isUserLoading,
    userError,
  };

  return <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>;
};

// -----------------------------
// Hook to use Firebase anywhere
// -----------------------------
export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
