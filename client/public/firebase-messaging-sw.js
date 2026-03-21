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

// Force immediate update for all users (don't wait for tabs to close)
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

messaging.onBackgroundMessage(function(payload) {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  var data = payload.data || {};
  var notification = payload.notification || {};
  var notificationTitle = data.title || notification.title || 'Trace';
  var notificationOptions = {
    body: data.body || notification.body || '',
    icon: '/vite.svg',
    tag: 'trace-bg-notif',
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
