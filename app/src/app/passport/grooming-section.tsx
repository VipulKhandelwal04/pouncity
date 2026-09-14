"use client";

import { useState } from "react";
import { isNextRedirectError } from "@/lib/next-redirect";
import { generateGroomingGuideAction } from "./grooming-actions";
import type { GroomingGuide } from "@/lib/grooming/grooming-guide";

export function GroomingSection({ guide }: { guide: GroomingGuide | null }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    setGenerating(true);
    setError(null);
    try {
      await generateGroomingGuideAction();
    } catch (err) {
      if (isNextRedirectError(err)) {
        throw err;
      }
      setError("Could not generate a guide. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section aria-labelledby="grooming-heading">
      <h2 id="grooming-heading">Grooming</h2>

      {guide && (
        <div>
          <p>{guide.frequencyGuidance}</p>
          <p>{guide.homeVsProfessionalGuidance}</p>
          <p>Reminder every {guide.reminderIntervalDays} days.</p>
          <p role="note">{guide.disclaimer}</p>
        </div>
      )}

      <form action={handleSubmit}>
        <button type="submit" disabled={generating}>
          {generating ? "Generating…" : guide ? "Regenerate guide" : "Generate grooming guide"}
        </button>

        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
