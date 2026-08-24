/* Service worker da bancada. — Web Push + clique em notificações. */

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("push", (event) => {
  let data = { title: "bancada.", body: "", url: "/", tag: undefined, image: null };
  try {
    data = { ...data, ...event.data.json() };
  } catch {
    /* payload vazio */
  }
  const options = {
    body: data.body,
    tag: data.tag,
    icon: "/icons/icon-192.png",
    badge: "/icons/badge-72.png",
    data: { url: data.url },
  };
  // Imagem grande da notícia (Android/desktop mostram; o iOS ignora).
  if (data.image) options.image = data.image;
  event.waitUntil(self.registration.showNotification(data.title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/";
  const external = /^https?:\/\//.test(url) && !url.startsWith(self.location.origin);

  event.waitUntil(
    (async () => {
      // Link externo (ex: artigo de notícia): abre diretamente o site.
      if (external) {
        await self.clients.openWindow(url);
        return;
      }
      // Link interno: reutiliza uma janela aberta da app, se existir.
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if ("focus" in client) {
          client.navigate(url);
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow(url);
    })()
  );
});
