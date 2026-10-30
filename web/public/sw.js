/* Service worker de Audio Biblia: avisos push y copia de las páginas para abrir sin conexión. */
const CACHE = "audio-biblia-v1";
const BASICOS = ["/", "/icon-192.png", "/badge-96.png", "/img/logo-blanco.png"];

self.addEventListener("install", (evento) => {
  evento.waitUntil(caches.open(CACHE).then((c) => c.addAll(BASICOS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (evento) => {
  evento.waitUntil(
    caches
      .keys()
      .then((llaves) => Promise.all(llaves.filter((l) => l !== CACHE).map((l) => caches.delete(l))))
      .then(() => self.clients.claim()),
  );
});

// Páginas: primero la red (para tener siempre lo más nuevo) y, si no hay conexión, la copia guardada.
self.addEventListener("fetch", (evento) => {
  const { request } = evento;
  if (request.method !== "GET" || request.mode !== "navigate") return;
  evento.respondWith(
    fetch(request)
      .then((respuesta) => {
        const copia = respuesta.clone();
        caches.open(CACHE).then((c) => c.put(request, copia));
        return respuesta;
      })
      .catch(() => caches.match(request).then((r) => r || caches.match("/"))),
  );
});

self.addEventListener("push", (evento) => {
  let datos = {};
  try {
    datos = evento.data ? evento.data.json() : {};
  } catch {
    datos = { body: evento.data ? evento.data.text() : "" };
  }
  const titulo = datos.title || "Audio Biblia";
  evento.waitUntil(
    self.registration.showNotification(titulo, {
      body: datos.body || "Ya están los audios de hoy.",
      icon: "/icon-192.png",
      badge: "/badge-96.png",
      tag: datos.tag || "audio-biblia",
      renotify: true,
      data: { url: datos.url || "/" },
    }),
  );
});

self.addEventListener("notificationclick", (evento) => {
  evento.notification.close();
  const destino = new URL(evento.notification.data?.url || "/", self.location.origin).href;
  evento.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((ventanas) => {
      for (const v of ventanas) {
        if (v.url.startsWith(self.location.origin) && "focus" in v) {
          v.navigate(destino);
          return v.focus();
        }
      }
      return self.clients.openWindow(destino);
    }),
  );
});
