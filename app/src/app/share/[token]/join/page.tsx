import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabaseCaregiverRepository } from "@/lib/passport/supabase-caregiver-repository";
import { joinAsCaregiver } from "@/lib/passport/join-as-caregiver";

export default async function JoinAsCaregiverPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // requireUser() redirects to /login if there's no session — shouldn't
  // normally happen here since this page is only reached via the
  // /login?redirectTo=/share/[token]/join flow after auth completes, but
  // it's a correct fallback if someone lands here directly.
  const { supabase, user } = await requireUser();

  const caregiverRepo = new SupabaseCaregiverRepository(supabase);
  const passport = await joinAsCaregiver(user.id, token, caregiverRepo);

  redirect(`/care/${passport.id}`);
}
