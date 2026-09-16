"use client";

import { useEffect } from "react";

/**
 * Registers the service worker for everyone at app load (production only, so
 * dev/HMR is untouched). Previously it registered only when someone enabled
 * reminders, which left the installed app with no offline screen. The worker
 * itself is navigation-fallback only; it never caches or serves stale pages.
 */
export function PwaSetup() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;
    if (!("serviceWorker" in navigator)) return;
    navigator.serviceWorker.register("/sw.js").catch(() => {
      /* registration is an enhancement — never surface a failure */
    });
  }, []);
  return null;
}
