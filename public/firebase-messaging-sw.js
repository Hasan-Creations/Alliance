
// Import the Firebase app and messaging libraries.
// See: https://firebase.google.com/docs/web/setup#access-firebase
importScripts("https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js");

// The Firebase config object is set by the hosting environment.
// See: https://firebase.google.com/docs/hosting/reserved-urls#sdk-config-object
const firebaseConfig = {
  projectId: "studio-1180220620-35da8",
  appId: "1:274725361691:web:3776639318ada047d240be",
  apiKey: "AIzaSyAH6rukfj5ln_NY69tbBCNAFB9cSDU-kOI",
  authDomain: "studio-1180220620-35da8.firebaseapp.com",
  messagingSenderId: "274725361691",
};

// Initialize the Firebase app in the service worker.
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

/**
 * Handles messages received when the app is in the background.
 * The function is given a payload object, which contains the notification data.
 */
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );

  // Customize the notification here
  const notificationTitle = payload.notification?.title || "Alliance Reminder";
  const notificationOptions = {
    body: payload.notification?.body || "You have a new notification.",
    icon: "/favicon.png", // Use your app's icon
    requireInteraction: true, // Keep notification until user interacts
    data: {
        click_action: payload.data?.click_action || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});


/**
 * Handles the 'notificationclick' event.
 * This is triggered when a user clicks on a notification.
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.', event);

    event.notification.close();

    const urlToOpen = event.notification.data.click_action || '/';

    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true,
        }).then((clientList) => {
            // If a window for the app is already open, focus it.
            for (const client of clientList) {
                if (client.url === urlToOpen && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise, open a new window.
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});
