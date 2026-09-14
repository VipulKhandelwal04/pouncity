"use client";

import { useState } from "react";
import { isNextRedirectError } from "@/lib/next-redirect";
import { updatePassportOptionalFieldsAction } from "./actions";
import type { Passport } from "@/lib/passport/passport";
import type { PassportCompleteness } from "@/lib/passport/passport-completeness";

export function CompleteProfileForm({
  passport,
  completeness,
}: {
  passport: Passport;
  completeness: PassportCompleteness;
}) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (completeness.filled === completeness.total) {
    return null;
  }

  async function handleSubmit(formData: FormData) {
    setSaving(true);
    setError(null);
    try {
      await updatePassportOptionalFieldsAction(formData);
    } catch (err) {
      if (isNextRedirectError(err)) {
        throw err;
      }
      setError("Could not save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <section aria-labelledby="complete-profile-heading">
      <h2 id="complete-profile-heading">
        Complete your passport ({completeness.filled}/{completeness.total})
      </h2>
      <p>
        Add a few more details so anyone caring for {passport.name} has the full
        picture.
      </p>

      <form action={handleSubmit}>
        <label htmlFor="quirks">Quirks</label>
        <textarea id="quirks" name="quirks" defaultValue={passport.quirks ?? ""} />

        <label htmlFor="vetName">Vet name</label>
        <input id="vetName" name="vetName" type="text" defaultValue={passport.vetName ?? ""} />

        <label htmlFor="vetPhone">Vet phone</label>
        <input
          id="vetPhone"
          name="vetPhone"
          type="tel"
          defaultValue={passport.vetPhone ?? ""}
        />

        <label htmlFor="vetClinic">Vet clinic</label>
        <input
          id="vetClinic"
          name="vetClinic"
          type="text"
          defaultValue={passport.vetClinic ?? ""}
        />

        <button type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save"}
        </button>

        {error && <p role="alert">{error}</p>}
      </form>
    </section>
  );
}
