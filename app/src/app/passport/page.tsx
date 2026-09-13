import Image from "next/image";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportRepository } from "@/lib/passport/supabase-passport-repository";
import { getPassportForOwner } from "@/lib/passport/passport-service";

export default async function PassportPage() {
  const { supabase, user } = await requireUser();

  const repo = new SupabasePassportRepository(supabase);
  const passport = await getPassportForOwner(user.id, repo);

  if (!passport) {
    redirect("/passport/new");
  }

  return (
    <main>
      <h1>{passport.name}&apos;s passport</h1>
      <Image src={passport.photoUrl} alt={passport.name} width={240} height={240} />
      <dl>
        <dt>Species</dt>
        <dd>{passport.species}</dd>
        <dt>Breed</dt>
        <dd>{passport.breed}</dd>
        <dt>Birth date</dt>
        <dd>{passport.birthDate}</dd>
        <dt>Weight</dt>
        <dd>{passport.weightKg} kg</dd>
      </dl>
    </main>
  );
}
