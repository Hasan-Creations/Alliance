
'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, getFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore'
import { getRemoteConfig } from 'firebase/remote-config';

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length) {
    const app = getApp();
    return getSdks(app);
  }
  
  const firebaseApp = initializeApp(firebaseConfig);
  
  // This check is to prevent crashing in non-browser environments (like SSR).
  if (typeof window !== 'undefined') {
    try {
      // Initialize Firestore with persistence settings. This should only run once.
      initializeFirestore(firebaseApp, {
        localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
      });
    } catch (err: any) {
        if (err.code == 'failed-precondition') {
            // This can happen if multiple tabs are open.
            console.warn('Firestore persistence failed. Multiple tabs open, persistence can only be enabled in one tab at a time.');
        } else if (err.code == 'unimplemented') {
            // The current browser does not support all of the features required to enable persistence
            console.warn('Firestore persistence is not supported in this browser. Offline functionality will be limited.');
        }
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  // Always use getFirestore() to retrieve the instance.
  // If initializeFirestore was called with settings, it returns that instance.
  // Otherwise, it returns the default instance. This prevents re-initialization errors.
  const firestore = getFirestore(firebaseApp);
  const remoteConfig = getRemoteConfig(firebaseApp);
  // You can set default values here if needed
  // remoteConfig.defaultConfig = { ... };
  
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: firestore,
    remoteConfig: remoteConfig,
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
export * from './remote-config/use-remote-config';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';

