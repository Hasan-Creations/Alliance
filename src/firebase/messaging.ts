'use client';

import { getApp } from 'firebase/app';
import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import { firebaseConfig } from './config';

// This function is designed to be called ONCE
export const requestPermissionAndGetToken = async () => {
  try {
    // Ensure Firebase is initialized
    const app = getApp();
    const messaging = getMessaging(app);

    // --- Request Permission ---
    // This will pop up the browser's permission request dialog
    const permission = await Notification.requestPermission();

    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      // --- Get Device Token ---
      // Use the VAPID key from your Firebase project settings
      const currentToken = await getToken(messaging, {
        vapidKey: 'BDS7iOqM2a6A3rCq5PqjVdJkXbHlJ0w8aQ9fRzK2cZ1xYtJvVbN9hG4sK3oF7eI6uW8iJ0mP4sX2w',
      });

      if (currentToken) {
        console.log('FCM Token:', currentToken);
        // You would typically send this token to your server to store it
        // and use it to send notifications to this specific device.
        return currentToken;
      } else {
        console.log('No registration token available. Request permission to generate one.');
        return null;
      }
    } else {
      console.log('Unable to get permission to notify.');
      return null;
    }
  } catch (err) {
    console.error('An error occurred while retrieving token. ', err);
    return null;
  }
};

// Function to set up the foreground message listener
export const onForegroundMessage = () => {
  const messaging = getMessaging(getApp());
  onMessage(messaging, (payload) => {
    console.log('Foreground message received. ', payload);
    // Here you could display the notification to the user in-app,
    // for example using a toast notification.
    // For this example, we'll just log it.
  });
};
