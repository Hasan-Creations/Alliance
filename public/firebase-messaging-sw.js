
// This file needs to be in the public directory.

// IMPORTANT: Do not import from other files. This file is executed in a
// separate service worker context and does not have access to the Next.js
// module system.

// Initialize the Firebase app in the service worker
// 'firebase-app-sw' is the name of the Firebase app in the service worker
self.importScripts("https://www.gstatic.com/firebasejs/11.9.1/firebase-app-compat.js");
self.importScripts("https://www.gstatic.com/firebasejs/11.9.1/firebase-messaging-compat.js");

const firebaseConfig = {
  "projectId": "studio-1180220620-35da8",
  "appId": "1:274725361691:web:3776639318ada047d240be",
  "apiKey": "AIzaSyAH6rukfj5ln_NY69tbBCNAFB9cSDU-kOI",
  "authDomain": "studio-1180220620-35da8.firebaseapp.com",
  "measurementId": "G-5G8EZZ221K",
  "messagingSenderId": "274725361691",
  "storageBucket": "studio-1180220620-35da8.appspot.com"
};

firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();

// If you want to handle background notifications, you can add a handler here.
// For now, this is enough to get the service worker registered.
messaging.onBackgroundMessage((payload) => {
  console.log(
    '[firebase-messaging-sw.js] Received background message ',
    payload
  );
  // Customize notification here
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
