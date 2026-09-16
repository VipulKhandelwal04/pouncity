// Pouncity service worker. Registered for everyone at app load (PwaSetup) so
// the installed app has a branded offline state; push reminders (ticket 09)
// ride the same worker. Reminder messages come from the ticket-10 scheduler.

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (event) => event.waitUntil(clients.claim()));

// Network-first for navigations, with a branded offline screen when the
// network is gone. Nothing else is intercepted or cached, so this can never
// serve a stale page.
const OFFLINE_HTML = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Pouncity</title>
<style>
  body{margin:0;min-height:100svh;display:grid;place-items:center;background:#FFF7E6;color:#161616;
    font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif;text-align:center;padding:24px}
  .ball{width:64px;height:64px;margin:0 auto 16px;display:block}
  h1{font-size:1.4rem;margin:0 0 8px}
  p{margin:0 0 20px;color:rgba(22,22,22,.72);line-height:1.5}
  button{font:600 1rem inherit;color:#161616;background:#FF6B4A;border:2.5px solid #161616;
    border-radius:999px;padding:13px 28px;cursor:pointer}
</style></head><body><div>
<svg class="ball" viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="13" fill="#FF6B4A"/>
<path d="M4 12 Q16 20 28 10 M3 18 Q16 25 28 17 M6 25 Q17 29 25 22 M7 7 Q18 6 27 13" stroke="#D8492B" stroke-width="2" fill="none" stroke-linecap="round"/></svg>
<h1>You're offline</h1>
<p>Pouncity needs a connection to fetch the diary.<br>It will be right here when you're back.</p>
<button onclick="location.reload()">Try again</button>
</div></body></html>`;

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(
      () =>
        new Response(OFFLINE_HTML, {
          headers: { "Content-Type": "text/html; charset=utf-8" },
        })
    )
  );
});

self.addEventListener("push", (event) => {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch {
    data = {};
  }
  const title = data.title || "Pouncity";
  const options = {
    body: data.body || "",
    tag: data.tag || "pouncity-reminder",
    data: { url: data.url || "/diary" },
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  const url = (event.notification.data && event.notification.data.url) || "/diary";
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
      for (const client of list) {
        if (client.url.includes(url) && "focus" in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow(url);
    })
  );
});
