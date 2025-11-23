
'use client';

import { useEffect, useCallback } from 'react';
import { useNotifications } from '@/hooks/use-notifications';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';

// A key to track if we have already prompted the user in the current session.
const SESSION_PROMPT_KEY = 'notification_prompted_session';

/**
 * An invisible component that prompts the user to enable notifications
 * if they haven't made a choice yet.
 */
export function NotificationPrompter() {
  const { user } = useUser();
  const { permission, requestPermission, isSupported } = useNotifications();
  const { toast } = useToast();

  const showPromptToast = useCallback(() => {
    // Show a toast notification to ask the user.
    const { dismiss } = toast({
      title: 'Enable Notifications?',
      description: 'Get reminders for your pending tasks and stay on track.',
      duration: 15000, // Keep the toast visible for longer
      action: (
        <Button
          onClick={async () => {
            await requestPermission(); // Trigger the browser's permission dialog
            dismiss(); // Close the toast once the user interacts
          }}
        >
          Enable
        </Button>
      ),
    });
  }, [toast, requestPermission]);

  useEffect(() => {
    // Conditions to show the prompt:
    // 1. Browser supports notifications.
    // 2. User is logged in.
    // 3. Permission is 'default' (no choice made yet).
    // 4. We haven't already prompted in this session.
    if (
      isSupported &&
      user &&
      permission === 'default' &&
      !sessionStorage.getItem(SESSION_PROMPT_KEY)
    ) {
      // Mark that we've prompted in this session.
      sessionStorage.setItem(SESSION_PROMPT_KEY, 'true');

      // Show the prompt after a short delay so it doesn't appear immediately on load.
      const timer = setTimeout(() => {
        showPromptToast();
      }, 5000); // 5-second delay

      return () => clearTimeout(timer);
    }
  }, [user, isSupported, permission, showPromptToast]);

  // This component renders nothing.
  return null;
}
