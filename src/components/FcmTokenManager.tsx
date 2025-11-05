
'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useFirebaseApp, useFirestore, useUser, setDocumentNonBlocking } from '@/firebase';
import { doc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export function FcmTokenManager() {
  const app = useFirebaseApp();
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    // Ensure all dependencies are available and we are in a browser environment
    if (!app || !firestore || !user || typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }
      
    const messaging = getMessaging(app);

    // Handle foreground messages
    const unsubscribeOnMessage = onMessage(messaging, (payload) => {
        console.log('Foreground message received.', payload);
        toast({
          title: payload.notification?.title,
          description: payload.notification?.body,
        });
    });
    
    const retrieveToken = async () => {
      try {
        // 1. Request permission
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Notification permission granted.');
          
          // 2. Get the token
          const currentToken = await getToken(messaging, {
            vapidKey: 'BCDeOLR6fW-6sZ_knCzAU92oeuxYWuNbMQ8hlNznD7inUTinfozDzxkDnsYDlkMIR2p03WNEdxbZdkkMg-a9sp8',
          });

          if (currentToken) {
            console.log('FCM Token:', currentToken);
            
            // 3. Save it to Firestore
            const tokenRef = doc(firestore, 'userTokens', currentToken);
            setDocumentNonBlocking(tokenRef, {
              userId: user.uid,
              createdAt: new Date().toISOString(),
            }, {}); // Use an empty options object for a direct overwrite
            
          } else {
            console.log('No registration token available. Request permission to generate one.');
          }
        } else {
          console.log('Unable to get permission to notify.');
        }
      } catch (error) {
        console.error('An error occurred while retrieving token. ', error);
      }
    };

    retrieveToken();
    
    // Cleanup function
    return () => {
      unsubscribeOnMessage();
    };

  }, [app, firestore, user, toast]); // Re-run when dependencies are ready

  return null; // This component does not render anything
}
