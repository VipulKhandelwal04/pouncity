"use client";

import { useState } from "react";
import { isNextRedirectError } from "@/lib/next-redirect";
import { confirmFedTodayAction } from "./tracking-actions";
import type { TrackingEntry } from "@/lib/tracking/tracking-entry";

export function TrackingSection({
  todayEntry,
  history,
}: {
  todayEntry: TrackingEntry | null;
  history: TrackingEntry[];
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setConfirming(true);
    setError(null);
    try {
      await confirmFedTodayAction(formData);
    } catch (err) {
      if (isNextRedirectError(err)) {
        throw err;
      }
      setError("Could not save. Please try again.");
    } finally {
      setConfirming(false);
    }
  }

  return (
    <section aria-labelledby="tracking-heading">
      <h2 id="tracking-heading">Daily tracking</h2>

      <form action={handleSubmit}>
        <button type="submit" disabled={confirming}>
          {todayEntry ? "✓ Fed today" : confirming ? "Saving…" : "Mark fed today"}
        </button>

        <label htmlFor="note">Anything worth noting? (optional)</label>
        <input id="note" name="note" type="text" defaultValue={todayEntry?.note ?? ""} />

        {error && <p role="alert">{error}</p>}
      </form>

      {history.length > 0 && (
        <ul>
          {history.map((entry) => (
            <li key={entry.id}>
              {entry.date}
              {entry.note && <> — {entry.note}</>}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
