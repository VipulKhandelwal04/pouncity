import Image from "next/image";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/supabase/require-user";
import { SupabasePassportRepository } from "@/lib/passport/supabase-passport-repository";
import { getPassportForOwner } from "@/lib/passport/passport-service";
import { passportCompleteness } from "@/lib/passport/passport-completeness";
import { SupabaseDietPlanRepository } from "@/lib/diet/supabase-diet-plan-repository";
import { SupabaseTrackingRepository } from "@/lib/tracking/supabase-tracking-repository";
import { todayDateString } from "@/lib/tracking/today";
import { CompleteProfileForm } from "./complete-profile-form";
import { DietPlanSection } from "./diet-plan-section";
import { TrackingSection } from "./tracking-section";

export default async function PassportPage() {
  const { supabase, user } = await requireUser();

  const repo = new SupabasePassportRepository(supabase);
  const passport = await getPassportForOwner(user.id, repo);

  if (!passport) {
    redirect("/passport/new");
  }

  const completeness = passportCompleteness(passport);
  // Already holding the passport, so look up its plan directly rather than
  // going through getDietPlanForPassport (which would re-fetch the
  // passport by owner internally).
  const dietRepo = new SupabaseDietPlanRepository(supabase);
  const dietPlan = await dietRepo.findByPassportId(passport.id);

  const trackingRepo = new SupabaseTrackingRepository(supabase);
  const [todayEntry, trackingHistory] = await Promise.all([
    trackingRepo.findByPassportIdAndDate(passport.id, todayDateString()),
    trackingRepo.findByPassportId(passport.id),
  ]);

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

      <CompleteProfileForm passport={passport} completeness={completeness} />

      <DietPlanSection plan={dietPlan} />

      <TrackingSection todayEntry={todayEntry} history={trackingHistory} />
    </main>
  );
}
