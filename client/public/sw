// Service Worker — EstudoLendário com Firebase Cloud Messaging
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyBHfn93lYERRYoorFIF_hh4nQYTElKDmfg",
  authDomain: "antiprocastinador.firebaseapp.com",
  projectId: "antiprocastinador",
  storageBucket: "antiprocastinador.appspot.com",
  messagingSenderId: "176220550517",
  appId: "1:176220550517:web:d933bbe5054dd1e1444f3c"
});

const messaging = firebase.messaging();

// Recebe push em background (app fechado)
messaging.onBackgroundMessage(payload => {
  const { title, body } = payload.notification || {};
  self.registration.showNotification(title || "EstudoLendário 📚", {
    body: body || "Hora de estudar!",
    icon: "/distintivo.png",
    badge: "/distintivo.png",
    tag: "estudolendario-push",
    renotify: true,
    data: { url: "/" }
  });
});

// Clique na notificação abre o app
self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow("/");
    })
  );
});
