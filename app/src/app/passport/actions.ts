"use server";

import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportRepository } from "@/lib/passport/supabase-passport-repository";
import { createPassport } from "@/lib/passport/passport-service";
import { isOwnPassportPhotoUrl } from "@/lib/passport/photo-url";

export async function createPassportAction(formData: FormData) {
  const { supabase, user } = await requireUser();

  const photoUrl = formData.get("photoUrl");
  if (typeof photoUrl !== "string" || !isOwnPassportPhotoUrl(photoUrl, user.id)) {
    // Server Actions are directly callable endpoints, not just form
    // submissions — never trust a client-supplied photoUrl without
    // confirming it points at this user's own uploaded object.
    throw new Error("Photo was not uploaded through the expected flow.");
  }

  const input = {
    name: formData.get("name"),
    species: formData.get("species"),
    breed: formData.get("breed"),
    birthDate: formData.get("birthDate"),
    weightKg: Number(formData.get("weightKg")),
    photoUrl,
  };

  const repo = new SupabasePassportRepository(supabase);
  await createPassport(input, user.id, repo);

  redirect("/passport");
}
