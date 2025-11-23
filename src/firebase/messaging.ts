'use client';

import { getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, deleteToken as deleteFCMToken } from 'firebase/messaging';
import { toast } from '@/hooks/use-toast';

// This function is designed to be called ONCE
export const requestPermissionAndGetToken = async (silent = false) => {
  try {
    const app = getApp();
    const messaging = getMessaging(app);

    if (!silent) {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.log('Unable to get permission to notify.');
        return null;
      }
    } else if (Notification.permission !== 'granted') {
        return null; // Don't prompt if silent and permission not granted
    }

    // By removing the vapidKey, the SDK will automatically use the correct
    // key from the project's configuration. This is the most reliable method.
    const currentToken = await getToken(messaging);

    if (currentToken) {
      console.log('FCM Token:', currentToken);
      return currentToken;
    } else {
      console.log('No registration token available. Request permission to generate one.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

export const deleteToken = async () => {
    try {
        const app = getApp();
        const messaging = getMessaging(app);
        await deleteFCMToken(messaging);
    } catch(err) {
        console.error('Error deleting FCM token: ', err);
    }
}

// Function to set up the foreground message listener
export const onForegroundMessage = () => {
  const messaging = getMessaging(getApp());
  const unsubscribe = onMessage(messaging, (payload) => {
    console.log('Foreground message received. ', payload);
    toast({
        title: payload.notification?.title || "New Notification",
        description: payload.notification?.body || "",
    });
  });
  return unsubscribe;
};
