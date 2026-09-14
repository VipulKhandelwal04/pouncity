import Image from "next/image";
import { notFound } from "next/navigation";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { SupabasePassportRepository } from "@/lib/passport/supabase-passport-repository";
import { getPassportByShareToken } from "@/lib/passport/get-passport-by-share-token";

export default async function SharedPassportPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Deliberately no requireUser() here — this route is the one
  // unauthenticated read path in the app, gated by the token itself
  // (via a SECURITY DEFINER RPC, not a broad RLS policy) rather than by
  // login.
  const supabase = await createSupabaseServerClient();
  const shareRepo = new SupabasePassportRepository(supabase);
  const passport = await getPassportByShareToken(token, shareRepo);

  if (!passport) {
    notFound();
  }

  return (
    <main>
      <p>Shared with you — view only.</p>
      <h1>{passport.name}</h1>
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
        {passport.quirks && (
          <>
            <dt>Quirks</dt>
            <dd>{passport.quirks}</dd>
          </>
        )}
        {(passport.vetName || passport.vetPhone || passport.vetClinic) && (
          <>
            <dt>Vet</dt>
            <dd>
              {[passport.vetName, passport.vetClinic, passport.vetPhone]
                .filter(Boolean)
                .join(" · ")}
            </dd>
          </>
        )}
      </dl>

      <p>
        Want to help track feeding or get reminders for {passport.name}?{" "}
        <a href={`/login?redirectTo=${encodeURIComponent(`/share/${token}/join`)}`}>
          Sign in or sign up
        </a>
      </p>
    </main>
  );
}
