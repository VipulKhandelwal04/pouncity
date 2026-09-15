"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Retired in ticket 02: creating, sharing, replacing and revoking the Handover
 * link now all live on the Circle (`/diary/circle`). This route only forwards,
 * so any older link or bookmark still lands in the right place.
 */
export default function SharePage() {
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
