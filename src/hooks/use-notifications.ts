'use client';

import { useState, useEffect, useCallback } from 'react';
import { requestPermissionAndGetToken, deleteToken as deleteFCMToken } from '@/firebase/messaging';
import { useUser, useFirestore, addDocumentNonBlocking, deleteDocumentNonBlocking } from '@/firebase';
import { collection, doc, writeBatch, getDocs, query, where } from 'firebase/firestore';

export type NotificationPermission = 'default' | 'granted' | 'denied';

async function saveTokenToFirestore(userId: string, firestore: any, token: string) {
  if (!userId || !firestore) return;
  const tokensRef = collection(firestore, 'users', userId, 'fcmTokens');
  // Check if token already exists
  const q = query(tokensRef, where('token', '==', token));
  const querySnapshot = await getDocs(q);
  if (querySnapshot.empty) {
    await addDocumentNonBlocking(tokensRef, {
      token: token,
      createdAt: Date.now(),
    });
    console.log('FCM token saved to Firestore.');
  } else {
    console.log('FCM token already exists in Firestore.');
  }
}

export async function deleteTokenFromFirestore(userId: string, firestore: any, token: string) {
    if (!userId || !firestore || !token) return;
    try {
        const tokensRef = collection(firestore, 'users', userId, 'fcmTokens');
        const q = query(tokensRef, where('token', '==', token));
        const querySnapshot = await getDocs(q);
        
        const batch = writeBatch(firestore);
        querySnapshot.forEach((document) => {
            batch.delete(document.ref);
        });
        await batch.commit();
        
        if (!querySnapshot.empty) {
            console.log('FCM token deleted from Firestore.');
        }
    } catch (error) {
        console.error("Error deleting token from Firestore:", error);
    }
}


export function useNotifications() {
  const { user } = useUser();
  const firestore = useFirestore();
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported, setIsSupported] = useState(false);
  const [currentToken, setCurrentToken] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window && 'serviceWorker' in navigator && 'PushManager' in window) {
      setIsSupported(true);
      setPermission(Notification.permission);
      if (Notification.permission === 'granted') {
        // Silently get token if permission is already granted
        requestPermissionAndGetToken(true).then(token => {
            setCurrentToken(token);
        });
      }
    } else {
      setIsSupported(false);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    if (!isSupported || !user || !firestore) {
      console.log("Notifications not supported, user not logged in, or firestore not available.");
      return null;
    }
    
    const token = await requestPermissionAndGetToken();
    setPermission(Notification.permission);
    
    if (token) {
      await saveTokenToFirestore(user.uid, firestore, token);
      setCurrentToken(token);
    }

    return token;
  }, [isSupported, user, firestore]);
  
  const deleteCurrentToken = useCallback(async () => {
    if (!user || !firestore || !currentToken) return;

    await deleteFCMToken(); // Deletes token from FCM
    await deleteTokenFromFirestore(user.uid, firestore, currentToken); // Deletes from Firestore
    setCurrentToken(null);
    setPermission('default'); // Reset permission state to allow re-requesting
    console.log('Token deleted from FCM and Firestore.');

  }, [user, firestore, currentToken]);


  return {
    isSupported,
    permission,
    requestPermission,
    deleteCurrentToken,
    currentToken,
  };
}
