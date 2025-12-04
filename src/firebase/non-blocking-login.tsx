
'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  getAdditionalUserInfo,
} from 'firebase/auth';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

type ToastFn = ReturnType<typeof useToast>['toast'];

/**
 * Handles Firebase authentication errors by displaying a user-friendly toast notification.
 * @param e The error object from Firebase.
 * @param toast The toast function to display the notification.
 */
function handleAuthError(e: any, toast: ToastFn) {
  let title = 'Authentication Failed';
  let description = 'An unexpected error occurred. Please try again.';

  // Check for FirebaseError by its name property instead of importing the type
  if (e.name === 'FirebaseError') {
    switch (e.code) {
      case 'auth/invalid-credential':
      case 'auth/wrong-password':
      case 'auth/user-not-found':
        title = 'Login Failed';
        description = 'The email or password you entered is incorrect.';
        break;
      case 'auth/email-already-in-use':
        title = 'Sign Up Failed';
        description = 'An account with this email address already exists.';
        break;
      case 'auth/weak-password':
        title = 'Sign Up Failed';
        description = 'The password is too weak. It must be at least 6 characters long.';
        break;
      case 'auth/invalid-email':
         title = 'Invalid Email';
         description = 'Please enter a valid email address.';
         break;
      default:
        console.error("Unhandled Firebase Auth Error:", e);
        // Keep the generic message for other errors
    }
  } else {
    console.error("Non-Firebase Auth Error:", e);
  }
  
  toast({
    variant: 'destructive',
    title,
    description,
  });
}

/**
 * A hook that provides a wrapped sign-up function.
 * This is necessary because useRouter can only be used in client components.
 */
export function useSignUp() {
  const router = useRouter();

  const initiateEmailSignUp = (authInstance: Auth, email: string, password: string, displayName: string, toast: ToastFn): void => {
    createUserWithEmailAndPassword(authInstance, email, password)
      .then((userCredential) => {
        const additionalInfo = getAdditionalUserInfo(userCredential);
        
        // Update profile with display name
        updateProfile(userCredential.user, { displayName }).catch((e) => {
            console.error("Failed to update profile:", e);
        });

        // If it's a new user, redirect to the initial setup page
        if (additionalInfo?.isNewUser) {
          router.push('/initial-setup');
        }
        // For existing users (which shouldn't happen here, but as a fallback)
        // or after setup, the onAuthStateChanged listener in the provider will handle the redirect.

      })
      .catch((e) => {
        handleAuthError(e, toast);
      });
  };

  return { initiateEmailSignUp };
}


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


/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string, toast: ToastFn): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password)
  .catch((e) => {
    handleAuthError(e, toast);
  });
}
