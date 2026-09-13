import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportRepository } from "@/lib/passport/supabase-passport-repository";
import { getPassportForOwner } from "@/lib/passport/passport-service";
import { PassportForm } from "./passport-form";

export default async function NewPassportPage() {
  const { supabase, user } = await requireUser();

  const repo = new SupabasePassportRepository(supabase);
  const existing = await getPassportForOwner(user.id, repo);

  if (existing) {
    redirect("/passport");
  }

  return (
    <main>
      <h1>Create your pet&apos;s passport</h1>
      <PassportForm />
    </main>
  );
}
