
'use client';
import type { toast } from '@/hooks/use-toast';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from 'firebase/auth';

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
export function initiateEmailSignUp(authInstance: Auth, email: string, password: string, displayName: string, toast: ReturnType<typeof toast>): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly. Do NOT use 'await createUserWithEmailAndPassword(...)'.
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
        // Once the user is created, update their profile with the display name
        if (userCredential.user) {
            updateProfile(userCredential.user, { displayName }).catch((e) => {
                console.error("Failed to update profile:", e);
                 toast({
                    variant: 'destructive',
                    title: 'Update Failed',
                    description: 'Could not set display name. You can set it later in settings.',
                });
            });
        }
    })
    .catch((e) => {
      let description = 'An unexpected error occurred.';
      if (e.code === 'auth/email-already-in-use') {
        description = 'This email address is already in use by another account.';
      } else if (e.code === 'auth/weak-password') {
        description = 'The password is too weak. Please use a stronger password.';
      }
       toast({
          variant: 'destructive',
          title: 'Sign Up Failed',
          description,
      });
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, toast: ReturnType<typeof toast>): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password)
  .catch((e) => {
      let description = 'An unexpected error occurred. Please try again.';
      if (e.code === 'auth/invalid-credential' || e.code === 'auth/wrong-password' || e.code === 'auth/user-not-found') {
        description = 'Invalid email or password. Please check your credentials and try again.';
      }
      toast({
          variant: 'destructive',
          title: 'Sign In Failed',
          description,
      });
  });
}
