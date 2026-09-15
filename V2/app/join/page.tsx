"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Retired in ticket 03: entering a Referral code to help with a pet now lives on
 * the Circle (`/diary/circle`, the "Helping with someone's pet?" action). This
 * route only forwards, so any older link or bookmark still lands in the right
 * place.
 */
export default function JoinByCode() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/diary/circle");
  }, [router]);

  return (
    <main className="app-shell" style={{ paddingTop: 80, textAlign: "center" }}>
      <span className="mono">Loading…</span>
    </main>
  );
}
