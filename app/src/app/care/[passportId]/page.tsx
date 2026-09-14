import Image from "next/image";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportAccessRepository } from "@/lib/passport/supabase-passport-access-repository";
import { SupabaseTrackingRepository } from "@/lib/tracking/supabase-tracking-repository";
import { todayDateString } from "@/lib/tracking/today";
import { TrackingSection } from "@/app/passport/tracking-section";

export default async function CaregiverPassportPage({
  params,
}: {
  params: Promise<{ passportId: string }>;
}) {
  const { passportId } = await params;
  const { supabase, user } = await requireUser();

  const accessRepo = new SupabasePassportAccessRepository(supabase);
  const passport = await accessRepo.findAccessiblePassportForUser(user.id);

  // RLS already scopes findAccessiblePassportForUser to only what this
  // user owns or is a caregiver of; checking the id also guards against
  // someone with access to a *different* passport landing on this URL by
  // guessing/copying an id that isn't theirs.
  if (!passport || passport.id !== passportId) {
    notFound();
  }

  const trackingRepo = new SupabaseTrackingRepository(supabase);
  const [todayEntry, trackingHistory] = await Promise.all([
    trackingRepo.findByPassportIdAndDate(passport.id, todayDateString()),
    trackingRepo.findByPassportId(passport.id),
  ]);

  return (
    <main>
      <p>You&apos;re helping care for {passport.name}.</p>
      <h1>{passport.name}</h1>
      <Image src={passport.photoUrl} alt={passport.name} width={240} height={240} />
      <dl>
        <dt>Species</dt>
        <dd>{passport.species}</dd>
        <dt>Breed</dt>
        <dd>{passport.breed}</dd>
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

      <TrackingSection todayEntry={todayEntry} history={trackingHistory} />
    </main>
  );
}
