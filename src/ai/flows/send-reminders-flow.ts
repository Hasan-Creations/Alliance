
'use server';
/**
 * @fileOverview A server-side flow to send task reminders.
 * - sendReminders: Queries for tasks due today and sends FCM notifications.
 */

import * as admin from 'firebase-admin';
import { format } from 'date-fns';

// Helper function to initialize Firebase Admin SDK. It's idempotent.
function initializeFirebaseAdmin() {
  // If already initialized, do nothing.
  if (admin.apps.length > 0) {
    return true;
  }

  // Check for both possible environment variable names.
  const serviceAccountString = process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT || process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!serviceAccountString) {
    console.error('[sendReminders] CRITICAL: FIREBASE_ADMIN_SERVICE_ACCOUNT or FIREBASE_SERVICE_ACCOUNT_KEY environment variable is not set. The server cannot authenticate with Firebase.');
    return false;
  }

  try {
    const serviceAccount = JSON.parse(serviceAccountString);

    // The private_key from the environment variable often has its newlines
    // escaped as "\\n". We need to replace them with actual newline characters "\n"
    // for the Firebase Admin SDK's crypto library to parse it correctly.
    if (serviceAccount.private_key) {
      serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log('[sendReminders] Firebase Admin SDK initialized successfully.');
    return true;
  } catch (e: any) {
    console.error('[sendReminders] CRITICAL: Failed to parse FIREBASE_ADMIN_SERVICE_ACCOUNT or initialize Firebase Admin SDK. Please check your service account credentials.', e.message);
    return false;
  }
}

export async function sendReminders() {
  // Attempt to initialize Firebase Admin. If it fails, stop execution.
  if (!initializeFirebaseAdmin()) {
    // A detailed error is already logged by the function above.
    throw new Error("Firebase Admin SDK initialization failed. Check server logs for details.");
  }

  // Get Firestore and Messaging instances AFTER initialization.
  const db = admin.firestore();
  const messaging = admin.messaging();

  console.log('Starting to send reminders...');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  try {
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
      console.log('No users found.');
      return;
    }

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Checking reminders for user: ${userId}`);

      const tasksSnapshot = await db.collection(`users/${userId}/tasks`)
        .where('dueDate', '==', todayStr)
        .where('completed', '==', false)
        .get();

      if (tasksSnapshot.empty) {
        console.log(`No tasks due today for user: ${userId}`);
        continue;
      }
      
      const dueTasksCount = tasksSnapshot.size;
      console.log(`Found ${dueTasksCount} tasks due today for user: ${userId}`);

      const tokensSnapshot = await db.collection('userTokens')
        .where('userId', '==', userId)
        .get();

      if (tokensSnapshot.empty) {
        console.log(`No FCM tokens found for user: ${userId}`);
        continue;
      }

      const tokens = tokensSnapshot.docs.map(doc => doc.id);
      console.log(`Found tokens for user ${userId}:`, tokens);
      
      const message = {
        notification: {
          title: 'Task Reminder from Alliance',
          body: `You have ${dueTasksCount} task${dueTasksCount > 1 ? 's' : ''} due today. Open Alliance to see them!`,
        },
        tokens: tokens,
      };

      try {
        const response = await messaging.sendEachForMulticast(message);
        console.log('Successfully sent message to:', response.successCount, 'tokens');
        
        if (response.failureCount > 0) {
          console.log('Failed to send to:', response.failureCount, 'tokens');
          const tokensToDelete: Promise<any>[] = [];
          response.responses.forEach((resp, idx) => {
            if (!resp.success && resp.error) { 
              console.error(`Failure for token ${tokens[idx]}:`, resp.error.message);
              // These error codes indicate that the token is invalid and should be deleted.
              if (
                resp.error.code === 'messaging/invalid-registration-token' ||
                resp.error.code === 'messaging/registration-token-not-registered'
              ) {
                const badToken = tokens[idx];
                console.log(`Scheduling deletion for invalid token: ${badToken}`);
                tokensToDelete.push(db.collection('userTokens').doc(badToken).delete());
              }
            }
          });
          await Promise.all(tokensToDelete);
          console.log(`Cleaned up ${tokensToDelete.length} invalid tokens.`);
        }
      } catch (error) {
          console.error('Error sending multicast message:', error);
      }
    }
  } catch (error) {
    console.error('Error in sendReminders flow:', error);
    // Re-throw the error to be caught by the API route handler
    throw new Error('Failed to execute sendReminders flow.');
  }
}
