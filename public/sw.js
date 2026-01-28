// Enterprise Service Worker
// Version: v3.0

self.addEventListener('install', (event) => {
    // INSTANT ACTIVATION: Skip waiting allows new SW to take over immediately
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    event.waitUntil(self.clients.claim());
});

self.addEventListener('push', (event) => {
    if (!event.data) return;

    try {
        const data = event.data.json();
        
        // iOS Requirement: Explicitly show notification
        const options = {
            body: data.body,
            icon: data.icon || '/icon.png',
            badge: '/icon.png', // Android specific, ignored on iOS
            data: {
                url: data.url || '/dashboard' // Deep link payload
            }
        };

        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    } catch (err) {
        console.error('Error parsing push data:', err);
    }
});

self.addEventListener('notificationclick', (event) => {
    // Close the notification
    event.notification.close();

    // UX: Open the App/URL
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
            // If we have an open window, focus it
            for (const client of clientList) {
                if (client.url && 'focus' in client) {
                    return client.focus();
                }
            }
            // Otherwise open new window
            if (self.clients.openWindow) {
                return self.clients.openWindow(event.notification.data.url);
            }
        })
    );
});
