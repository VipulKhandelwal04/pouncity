"use client";

import { useState } from "react";
import { isNextRedirectError } from "@/lib/next-redirect";
import { generateHandoverLinkAction } from "./handover-actions";

export function HandoverSection({ shareToken }: { shareToken: string | null }) {
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareUrl =
    shareToken && typeof window !== "undefined"
      ? `${window.location.origin}/share/${shareToken}`
      : null;

  async function handleSubmit() {
    if (shareToken) {
      const confirmed = window.confirm(
        "This invalidates the current link — anyone you already shared it with " +
          "(e.g. a sitter) will lose access and need the new one. Continue?",
      );
      if (!confirmed) return;
    }

    setGenerating(true);
    setError(null);
    try {
      await generateHandoverLinkAction();
    } catch (err) {
      if (isNextRedirectError(err)) {
        throw err;
      }
      setError("Could not generate a link. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <section aria-labelledby="handover-heading">
      <h2 id="handover-heading">Handover</h2>
      <p>
        Anyone with this link can view the passport instantly — no account
        needed. It stays live until you regenerate or revoke it.
      </p>

      {shareUrl && (
        <p>
          <a href={shareUrl}>{shareUrl}</a>
        </p>
      )}

      <form action={handleSubmit}>
        <button type="submit" disabled={generating}>
          {generating ? "Generating…" : shareToken ? "Regenerate link" : "Generate share link"}
        </button>

        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
