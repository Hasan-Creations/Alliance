// This file needs to be in the public directory.

// Import the Firebase app and messaging libraries.
// You must use a specific version of the Firebase JS SDK.
importScripts("https://www.gstatic.com/firebasejs/10.12.3/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.12.3/firebase-messaging-compat.js");

// Your web app's Firebase configuration.
const firebaseConfig = {
  "projectId": "studio-1180220620-35da8",
  "appId": "1:274725361691:web:3776639318ada047d240be",
  "apiKey": "AIzaSyAH6rukfj5ln_NY69tbBCNAFB9cSDU-kOI",
  "authDomain": "studio-1180220620-35da8.firebaseapp.com",
  "measurementId": "",
  "messagingSenderId": "274725361691"
};


// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  // Customize notification here
  const notificationTitle = payload.notification?.title || "Todo Reminder";
  const notificationOptions = {
    body: payload.notification?.body || "You still have unfinished tasks!",
    icon: "/favicon.png", // The icon you provided
    requireInteraction: true, // This is the key for persistent notifications
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
