'use client';
import { useFirebase } from '@/firebase/provider';
import type { Analytics } from 'firebase/analytics';

/**
 * Hook specifically for accessing the Firebase Analytics instance.
 * @returns {Analytics | null} The Firebase Analytics instance, or null if not available.
 */
export const useAnalytics = (): Analytics | null => {
  const { analytics } = useFirebase();
  return analytics;
};
