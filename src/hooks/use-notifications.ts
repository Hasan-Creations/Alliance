'use client';

import { useState, useEffect, useCallback } from 'react';
import { requestPermissionAndGetToken } from '@/firebase/messaging';

export type NotificationPermission = 'default' | 'granted' | 'denied';

export function useNotifications() {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // Check for support on the client side
    if ('Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
    } else {
        setIsSupported(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported) {
      console.log("This browser does not support notifications.");
      return;
    }
    
    // This will trigger the browser's permission prompt and get the FCM token
    const token = await requestPermissionAndGetToken();
    
    // After the user interacts with the prompt, update the permission state
    setPermission(Notification.permission);

    return token;
  }, [isSupported]);

  return {
    isSupported,
    permission,
    requestPermission,
  };
}
