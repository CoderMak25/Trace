/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'placeholder',
  authDomain: 'placeholder',
  projectId: 'placeholder',
  storageBucket: 'placeholder',
  messagingSenderId: 'placeholder',
  appId: 'placeholder',
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || 'Trace', {
    body: body || 'You have a new notification',
    icon: '/vite.svg',
    badge: '/vite.svg',
  });
});
