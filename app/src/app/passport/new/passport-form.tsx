"use client";

import { useState } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { isNextRedirectError } from "@/lib/next-redirect";
import { createPassportAction } from "../actions";

export function PassportForm() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(formData: FormData) {
    setError(null);

    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) {
      setError("Please choose a photo of your pet.");
      return;
    }

    setUploading(true);

    const supabase = createSupabaseBrowserClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("You must be signed in.");
      setUploading(false);
      return;
    }

    const path = `${user.id}/${Date.now()}-${photo.name}`;
    const { error: uploadError } = await supabase.storage
      .from("passport-photos")
      .upload(path, photo);

    if (uploadError) {
      setError("Photo upload failed. Please try again.");
      setUploading(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage
      .from("passport-photos")
      .getPublicUrl(path);

    formData.set("photoUrl", publicUrlData.publicUrl);
    formData.delete("photo");

    try {
      await createPassportAction(formData);
      // createPassportAction redirects on success; it doesn't return.
    } catch (err) {
      if (isNextRedirectError(err)) {
        // Expected control-flow signal from next/navigation's redirect() —
        // let it propagate so navigation actually happens.
        throw err;
      }

      // Passport creation failed after the photo was already uploaded
      // (e.g. duplicate passport, validation error). Clean up the now-
      // orphaned upload so it doesn't sit in public storage unreferenced.
      await supabase.storage.from("passport-photos").remove([path]);

      setError("Could not create the passport. Please try again.");
      setUploading(false);
    }
  }

  return (
    <form action={handleSubmit}>
      <label htmlFor="name">Name</label>
      <input id="name" name="name" type="text" required />

      <fieldset>
        <legend>Species</legend>
        <label>
          <input type="radio" name="species" value="dog" required /> Dog
        </label>
        <label>
          <input type="radio" name="species" value="cat" /> Cat
        </label>
      </fieldset>

      <label htmlFor="breed">Breed</label>
      <input id="breed" name="breed" type="text" required />

      <label htmlFor="birthDate">Birth date</label>
      <input id="birthDate" name="birthDate" type="date" required />

      <label htmlFor="weightKg">Weight (kg)</label>
      <input id="weightKg" name="weightKg" type="number" step="0.1" min="0.1" required />

      <label htmlFor="photo">Photo</label>
      <input id="photo" name="photo" type="file" accept="image/*" required />

      <button type="submit" disabled={uploading}>
        {uploading ? "Creating…" : "Create passport"}
      </button>

      {error && <p role="alert">{error}</p>}
    </form>
  );
}
