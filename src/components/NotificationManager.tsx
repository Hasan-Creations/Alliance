'use client';

import { useEffect } from 'react';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { useFirebaseApp } from '@/firebase/provider';
import { useToast } from '@/hooks/use-toast';

export function NotificationManager() {
  const app = useFirebaseApp();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && app) {
      const messaging = getMessaging(app);

      // Handle foreground messages
      onMessage(messaging, (payload) => {
        console.log('Foreground message received.', payload);
        toast({
          title: payload.notification?.title,
          description: payload.notification?.body,
        });
      });

      const requestPermissionAndGetToken = async () => {
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
              // In a real app, you would send this token to your server to store it.
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          } else {
            console.log('Unable to get permission to notify.');
          }
        } catch (error) {
          console.error('An error occurred while requesting permission or getting token.', error);
        }
      };

      requestPermissionAndGetToken();
    }
  }, [app, toast]);

  return null; // This component does not render anything
}
