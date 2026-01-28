// Enterprise Service Worker
// Version: v3.1 (Fixed & Robust)

self.addEventListener('install', (event) => {
    // INSTANT ACTIVATION: Skip waiting allows new SW to take over immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', function (event) {
  // 1. Daten sicher extrahieren
  let data = {};
  try {
    if (event.data) {
      data = event.data.json();
    }
  } catch (e) {
    console.error('Push data parsing failed', e);
    // Fallback, falls JSON fehlschlägt
    data = { title: 'MediLog', body: event.data ? event.data.text() : 'Neue Nachricht' };
  }

  // 2. Fallback-Werte setzen (WICHTIG für iOS!)
  const title = data.title || 'MediLog Nachricht';
  const options = {
    body: data.body || 'Bestand prüfen!',
    icon: '/icon.png', // Muss im public ordner existieren!
    badge: '/icon.png',
    data: { url: data.url || '/' }, // URL zum Öffnen (wrapped in inner data obj)
    // iOS spezifische Optionen, damit es zuverlässiger ist
    tag: 'medilog-notification', 
    renotify: true
  };

  // 3. Die Benachrichtigung erzwingen
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Klick-Verhalten (Öffnet die App)
self.addEventListener('notificationclick', function (event) {
  event.notification.close();
  
  // Extract URL from nested data object or directly
  const urlToOpen = (event.notification.data && event.notification.data.url) || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // Wenn Tab schon offen ist -> Fokus
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        // Check if client is focusing on our app base URL
        if (client.url && client.url.includes(self.registration.scope) && 'focus' in client) {
             return client.focus().then(focusedClient => {
                 // Optional: Navigate to specific URL after focusing
                 if (focusedClient && focusedClient.navigate) {
                     return focusedClient.navigate(urlToOpen);
                 }
             });
        }
      }
      // Sonst -> Neu öffnen
      if (clients.openWindow)
        return clients.openWindow(urlToOpen);
    })
  );
});
