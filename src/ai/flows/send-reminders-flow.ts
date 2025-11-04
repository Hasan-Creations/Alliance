
'use server';
/**
 * @fileOverview A server-side flow to send task reminders.
 * - sendReminders: Queries for tasks due today and sends FCM notifications.
 */

import * as admin from 'firebase-admin';
import { format } from 'date-fns';

// Initialize Firebase Admin SDK
// This should only be done once.
if (!admin.apps.length) {
  try {
    // In a deployed environment (like Vercel), use environment variables
    const serviceAccount = JSON.parse(process.env.FIREBASE_ADMIN_SERVICE_ACCOUNT!);
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
  } catch (e) {
    console.error('Failed to initialize Firebase Admin SDK:', e);
  }
}

const db = admin.firestore();
const messaging = admin.messaging();

export async function sendReminders() {
  console.log('Starting to send reminders...');
  const todayStr = format(new Date(), 'yyyy-MM-dd');

  try {
    // 1. Get all users
    const usersSnapshot = await db.collection('users').get();
    if (usersSnapshot.empty) {
      console.log('No users found.');
      return;
    }

    for (const userDoc of usersSnapshot.docs) {
      const userId = userDoc.id;
      console.log(`Checking reminders for user: ${userId}`);

      // 2. For each user, find tasks due today
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

      // 3. Get the user's FCM tokens
      const tokensSnapshot = await db.collection('userTokens')
        .where('userId', '==', userId)
        .get();

      if (tokensSnapshot.empty) {
        console.log(`No FCM tokens found for user: ${userId}`);
        continue;
      }

      const tokens = tokensSnapshot.docs.map(doc => doc.id);
      console.log(`Found tokens for user ${userId}:`, tokens);
      
      // 4. Send notification
      const message = {
        notification: {
          title: 'Task Reminder from Alliance',
          body: `You have ${dueTasksCount} task${dueTasksCount > 1 ? 's' : ''} due today. Open Alliance to see them!`,
        },
        tokens: tokens,
      };

      const response = await messaging.sendEachForMulticast(message);
      console.log('Successfully sent message to:', response.successCount, 'tokens');
      
      if (response.failureCount > 0) {
        console.log('Failed to send to:', response.failureCount, 'tokens');
        const tokensToDelete: Promise<any>[] = [];
        response.responses.forEach((resp, idx) => {
          if (!resp.success && resp.error) { // Check if resp.error exists
            console.error(`Failure for token ${tokens[idx]}:`, resp.error);
            // Check for the specific error indicating an invalid or unregistered token
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

        // Wait for all invalid tokens to be deleted.
        await Promise.all(tokensToDelete);
        console.log(`Cleaned up ${tokensToDelete.length} invalid tokens.`);
      }
    }
  } catch (error) {
    console.error('Error in sendReminders flow:', error);
    // Re-throw the error to be caught by the API route handler
    throw new Error('Failed to execute sendReminders flow.');
  }
}
