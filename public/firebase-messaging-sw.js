// This file must be in the public directory.

// Scripts for Firebase products are imported on demand.
import { initializeApp } from "firebase/app";
import { getMessaging, onBackgroundMessage } from "firebase/messaging/sw";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAH6rukfj5ln_NY69tbBCNAFB9cSDU-kOI",
  authDomain: "studio-1180220620-35da8.firebaseapp.com",
  projectId: "studio-1180220620-35da8",
  storageBucket: "studio-1180220620-35da8.appspot.com",
  messagingSenderId: "274725361691",
  appId: "1:274725361691:web:3776639318ada047d240be",
  measurementId: "G-5G8EZZ221K"
};

// Initialize the Firebase app in the service worker
const firebaseApp = initializeApp(firebaseConfig);
const messaging = getMessaging(firebaseApp);

onBackgroundMessage(messaging, (payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message ",
    payload
  );
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: payload.notification.icon || "/favicon.png",
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
