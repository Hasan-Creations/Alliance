'use client';

import { useEffect } from 'react';
import { getMessaging, getToken } from 'firebase/messaging';
import { useFirebaseApp } from '@/firebase/provider';

export function NotificationManager() {
  const app = useFirebaseApp();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator && app) {
      const messaging = getMessaging(app);

      const requestPermission = async () => {
        try {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            console.log('Notification permission granted.');
            
            // Get the token
            const currentToken = await getToken(messaging, {
              vapidKey: 'BDfSJS61x6-Tf8u8Z7M0zZ81sY25pA48-8Xw1l3g9s9y3e8jW2h3g8g8j1J3g8J3', // This should be replaced with your actual VAPID key
            });

            if (currentToken) {
              console.log('FCM Token:', currentToken);
              // Here you would typically send this token to your backend to store it.
              // e.g., sendTokenToServer(currentToken);
            } else {
              console.log('No registration token available. Request permission to generate one.');
            }
          } else {
            console.log('Unable to get permission to notify.');
          }
        } catch (error) {
          console.error('An error occurred while requesting permission. ', error);
        }
      };

      requestPermission();
    }
  }, [app]);

  return null; // This component does not render anything
}
