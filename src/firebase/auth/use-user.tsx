'use client';

import { useFirebase, type UserHookResult } from '../provider';

/**
 * Hook for accessing the authenticated user's state.
 * Returns the User object, loading status, and any authentication errors.
 */
export const useUser = (): UserHookResult => {
  const { user, isUserLoading, userError } = useFirebase();
  return { user, isUserLoading, userError };
};
