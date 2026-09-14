"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportRepository } from "@/lib/passport/supabase-passport-repository";
import { generateHandoverLink } from "@/lib/passport/generate-handover-link";

export async function generateHandoverLinkAction() {
  const { supabase, user } = await requireUser();

  const passportRepo = new SupabasePassportRepository(supabase);
  await generateHandoverLink(user.id, passportRepo);

  revalidatePath("/passport");
}
