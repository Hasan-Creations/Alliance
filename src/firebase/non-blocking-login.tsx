
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance).catch((e) => {
    // Although sign-in errors are less common for anonymous auth,
    // we can still wire them to our global handler if needed.
    // For now, console.error is sufficient as it's a critical setup issue.
    console.error("Anonymous sign-in failed:", e);
  });
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, displayName: string): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
        // Once the user is created, update their profile with the display name
        if (userCredential.user) {
            updateProfile(userCredential.user, { displayName }).catch((e) => {
                console.error("Failed to update profile:", e);
            });
        }
    })
    .catch((e) => {
      // Handle specific auth errors if necessary
      console.error("Email sign-up failed:", e);
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password)
  .catch((e) => {
    // Handle specific auth errors if necessary
    console.error("Email sign-in failed:", e);
  });
}
