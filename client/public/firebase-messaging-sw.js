importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/8.10.1/firebase-messaging.js');

const firebaseConfig = {
  apiKey: "AIzaSyBmkBXIYgglc7ZX5x3fzIqElUcNTJXlYAU",
  authDomain: "trace-d2d17.firebaseapp.com",
  projectId: "trace-d2d17",
  storageBucket: "trace-d2d17.firebasestorage.app", // Added basic bucket format
  messagingSenderId: "137845984533",
  appId: "1:137845984533:web:50e1905c6d07f89a03ad1c"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.data?.title || payload.notification?.title || 'Trace';
  const notificationOptions = {
    body: payload.data?.body || payload.notification?.body || '',
    icon: '/vite.svg',
    tag: 'trace-bg-notif',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
