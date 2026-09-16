"use client";

import { useEffect } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

/**
 * A back/forward-cache restore (the mobile back gesture, notably in the
 * installed app) can resurrect a signed-in screen after sign-out: the browser
 * brings the page back from memory, state and all, without remounting, so no
 * auth gate re-runs and the old diary UI shows as if still signed in. On any
 * restored gated screen, re-check the session and eject to the landing page
 * when it is gone. Signed-in restores are untouched.
 */
export function BfcacheGuard() {
  useEffect(() => {
    const onShow = (e: PageTransitionEvent) => {
      if (!e.persisted) return;
      const path = window.location.pathname;
      if (!path.startsWith("/diary") && !path.startsWith("/care")) return;
      void supabaseBrowser()
        .auth.getSession()
        .then(({ data: { session } }) => {
          if (!session) window.location.replace("/");
        });
    };
    window.addEventListener("pageshow", onShow);
    return () => window.removeEventListener("pageshow", onShow);
  }, []);
  return null;
}
