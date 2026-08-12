self.addEventListener('push', (event) => {
  const data = event.data.json();

  self.registration.showNotification(data.title, {
    body: data.body,
    icon: '/favicon.ico',
    // Carried through so notificationclick below knows where to navigate.
    data: { cardId: data.cardId, boardId: data.boardId },
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const { cardId, boardId } = event.notification.data || {};
  const targetUrl = cardId && boardId
    ? `/boards/${boardId}?card=${cardId}`
    : '/boards';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Reuse an already-open tab if there is one, focus it and navigate.
      for (const client of windowClients) {
        if ('focus' in client) {
          client.focus();
          if ('navigate' in client) {
            return client.navigate(targetUrl);
          }
        }
      }
      // Otherwise open a new tab.
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    }),
  );
});
