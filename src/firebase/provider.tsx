'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  Auth,
  onAuthStateChanged,
  type User,
} from 'firebase/auth';
import {
  Firestore,
} from 'firebase/firestore';

// -----------------------------
// Types
// -----------------------------
export interface FirebaseContextValue {
  firebaseApp: unknown;
  auth: Auth;
  firestore: Firestore;
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

interface FirebaseProviderProps {
  firebaseApp: unknown;
  auth: Auth;
  firestore: Firestore;
  children: ReactNode;
}

export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// -----------------------------
// Context setup
// -----------------------------
const FirebaseContext = createContext<FirebaseContextValue | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  firebaseApp,
  auth,
  firestore,
  children,
}) => {
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

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

// -----------------------------
// Hook to use Firebase anywhere
// -----------------------------
export const useFirebase = (): FirebaseContextValue => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};
