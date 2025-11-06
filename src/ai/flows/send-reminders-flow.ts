'use server';
/**
 * @fileOverview A server-side flow to send task reminders.
 * - sendReminders: Queries for tasks due today and sends FCM notifications.
 */

import * as admin from 'firebase-admin';
import { format } from 'date-fns';
import type { NextRequest } from 'next/server';

// Helper: initialize Firebase Admin SDK safely (idempotent)
function initializeFirebaseAdmin() {
  const serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

  if (!serviceAccountString) {
    console.error(
      '[sendReminders] CRITICAL: FIREBASE_SERVICE_ACCOUNT_KEY env var not set.'
    );
    return false;
  }

  if (admin.apps.length > 0) return true;

  try {
    const serviceAccount = JSON.parse(serviceAccountString);
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });

    console.log('[sendReminders] Firebase Admin SDK initialized successfully.');
    return true;
  } catch (e: any) {
    console.error(
      '[sendReminders] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize Firebase Admin SDK:',
      e.message
    );
    return false;
  }
}

export async function sendReminders(req: NextRequest) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(
      '[sendReminders] Skipping reminder check in development environment.'
    );
    return;
  }

  // --- Authorization (Vercel Cron Secret) ---
  const vercelCronSecret = req.headers.get('x-vercel-cron-secret');
  if (vercelCronSecret !== process.env.VERCEL_CRON_SECRET) {
    console.error(
      '[sendReminders] Unauthorized: x-vercel-cron-secret header did not match.'
    );
    throw new Error('Unauthorized');
  }

  // --- Initialize Firebase ---
  if (!initializeFirebaseAdmin()) {
    throw new Error(
      'Firebase Admin SDK initialization failed. Check server logs for details.'
    );
  }

  const db = admin.firestore();
  const messaging = admin.messaging();
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  console.log('[sendReminders] Starting reminder job...');

  try {
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
      console.log('[sendReminders] No users found.');
      return;
    }

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`[sendReminders] Checking tasks for user: ${userId}`);

      const tasksSnapshot = await db
        .collection(`users/${userId}/tasks`)
        .where('dueDate', '==', todayStr)
        .where('completed', '==', false)
        .get();

      if (tasksSnapshot.empty) continue;

      const dueTasksCount = tasksSnapshot.size;
      const tokensSnapshot = await db
        .collection('userTokens')
        .where('userId', '==', userId)
        .get();

      if (tokensSnapshot.empty) continue;

      const tokens = tokensSnapshot.docs.map((doc) => doc.id);
      const message = {
        notification: {
          title: 'Task Reminder from Alliance',
          body: `You have ${dueTasksCount} task${
            dueTasksCount > 1 ? 's' : ''
          } due today. Open Alliance to see them!`,
        },
        tokens,
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log(
        `[sendReminders] Sent message to ${response.successCount} tokens for user ${userId}`
      );

      if (response.failureCount > 0) {
        const tokensToDelete: Promise<any>[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) {
            const badToken = tokens[idx];
            if (
              resp.error.code === 'messaging/invalid-registration-token' ||
              resp.error.code === 'messaging/registration-token-not-registered'
            ) {
              console.log(
                `[sendReminders] Removing invalid token for user ${userId}: ${badToken}`
              );
              tokensToDelete.push(db.collection('userTokens').doc(badToken).delete());
            }
          }
        });
        await Promise.all(tokensToDelete);
        console.log(
          `[sendReminders] Cleaned up ${tokensToDelete.length} invalid tokens.`
        );
      }
    }
  } catch (error) {
    console.error('[sendReminders] Error during reminder flow:', error);
    throw new Error('Failed to execute sendReminders flow.');
  }
}
