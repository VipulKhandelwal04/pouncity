"use client";

import { useState } from "react";
import { isNextRedirectError } from "@/lib/next-redirect";
import { generateHandoverLinkAction, revokeHandoverLinkAction } from "./handover-actions";

export function HandoverSection({ shareToken }: { shareToken: string | null }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shareUrl =
    shareToken && typeof window !== "undefined"
      ? `${window.location.origin}/share/${shareToken}`
      : null;

  async function runAction(action: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await action();
    } catch (err) {
      if (isNextRedirectError(err)) {
        throw err;
      }
      setError("Could not update the link. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGenerate() {
    if (shareToken) {
      const confirmed = window.confirm(
        "This invalidates the current link — anyone you already shared it with " +
          "(e.g. a sitter) will lose access and need the new one. Continue?",
      );
      if (!confirmed) return;
    }
    await runAction(generateHandoverLinkAction);
  }

  async function handleRevoke() {
    const confirmed = window.confirm(
      "This immediately stops the current link from working for anyone who has it. Continue?",
    );
    if (!confirmed) return;
    await runAction(revokeHandoverLinkAction);
  }

  return (
    <section aria-labelledby="handover-heading">
      <h2 id="handover-heading">Handover</h2>
      <p>
        Anyone with this link can view the passport instantly — no account
        needed. It stays live until you regenerate or revoke it.
      </p>

      <p>
        <strong>Status:</strong> {shareToken ? "Active" : "No active link"}
      </p>

      {shareUrl && (
        <p>
          <a href={shareUrl}>{shareUrl}</a>
        </p>
      )}

      <button type="button" onClick={handleGenerate} disabled={busy}>
        {busy ? "Working…" : shareToken ? "Regenerate link" : "Generate share link"}
      </button>

      {shareToken && (
        <button type="button" onClick={handleRevoke} disabled={busy}>
          Revoke access
        </button>
      )}

      {error && <p role="alert">{error}</p>}
    </section>
  );
}
