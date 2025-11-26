
'use client';

import { useEffect } from 'react';
import { onForegroundMessage } from '@/firebase/messaging';
import { useUser } from '@/firebase';

/**
 * An invisible component that sets up the Firebase messaging listener
 * for foreground (in-app) notifications.
 */
export function FirebaseMessagingListener() {
  const { user } = useUser();

  useEffect(() => {
    // Only set up the listener if the user is logged in
    if (user && typeof window !== 'undefined') {
      const unsubscribe = onForegroundMessage();

      // Clean up the listener when the component unmounts or the user logs out
      return () => {
        unsubscribe();
      };
    }
  }, [user]);

  // This component renders nothing.
  return null;
}
