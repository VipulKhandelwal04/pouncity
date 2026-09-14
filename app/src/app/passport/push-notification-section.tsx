"use client";

import { useEffect, useState } from "react";
import { urlBase64ToUint8Array } from "@/lib/reminders/base64url";
import { subscribeToPushAction, unsubscribeFromPushAction } from "./push-actions";

type Status = "checking" | "unsupported" | "subscribed" | "not-subscribed";

export function PushNotificationSection({ vapidPublicKey }: { vapidPublicKey: string }) {
  const [status, setStatus] = useState<Status>("checking");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function checkStatus() {
      if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
        if (!cancelled) setStatus("unsupported");
        return;
      }
      const registration = await navigator.serviceWorker.getRegistration();
      const existing = await registration?.pushManager.getSubscription();
      if (!cancelled) setStatus(existing ? "subscribed" : "not-subscribed");
    }

    checkStatus();
    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setError("Notifications were not allowed.");
        setStatus("not-subscribed");
        return;
      }

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        // Uint8Array.from() is always backed by a real ArrayBuffer at
        // runtime, never a SharedArrayBuffer, but TS's ArrayBufferLike
        // typing can't express that distinction — hence the cast.
        applicationServerKey: urlBase64ToUint8Array(vapidPublicKey) as BufferSource,
      });

      await subscribeToPushAction(subscription.toJSON());
      setStatus("subscribed");
    } catch {
      setError("Could not enable notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function disable() {
    setBusy(true);
    setError(null);
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = await registration?.pushManager.getSubscription();

      if (subscription) {
        const endpoint = subscription.endpoint;
        // Unsubscribe the browser first — that's the state that actually
        // matters ("will I keep getting pushed to"). Reflect it in the UI
        // immediately, then best-effort clean up the server row: a stale
        // row there just gets swept up next time this endpoint 410s, or
        // overwritten by a future re-subscribe (upsert-by-endpoint) — it
        // can't cause the app to lie about whether notifications are on.
        await subscription.unsubscribe();
        setStatus("not-subscribed");
        try {
          await unsubscribeFromPushAction(endpoint);
        } catch {
          // Non-fatal — see above.
        }
      } else {
        setStatus("not-subscribed");
      }
    } catch {
      setError("Could not disable notifications. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (status === "unsupported") {
    return null; // Not required — this is purely additive, per Ticket 09.
  }

  return (
    <section aria-labelledby="push-heading">
      <h2 id="push-heading">Reminders</h2>

      {status === "checking" && <p>Checking notification status…</p>}

      {status === "not-subscribed" && (
        <button type="button" onClick={enable} disabled={busy}>
          {busy ? "Enabling…" : "Enable reminders"}
        </button>
      )}

      {status === "subscribed" && (
        <>
          <p>Reminders are on for this device.</p>
          <button type="button" onClick={disable} disabled={busy}>
            {busy ? "Disabling…" : "Disable reminders"}
          </button>
        </>
      )}

      {error && <p role="alert">{error}</p>}
    </section>
  );
}
