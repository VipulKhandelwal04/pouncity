import type { SupabaseClient } from "@supabase/supabase-js";
import type { Passport } from "./passport";
import type { PassportAccessRepository } from "./passport-access-repository";
import { toPassport, type PassportRow } from "./supabase-passport-repository";

export class SupabasePassportAccessRepository implements PassportAccessRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findAccessiblePassportForUser(userId: string): Promise<Passport | null> {
    const owned = await this.client
      .from("passports")
      .select()
      .eq("owner_id", userId)
      .maybeSingle();

    if (owned.error) throw owned.error;
    if (owned.data) return toPassport(owned.data as PassportRow);

    // RLS already restricts this join to the caller's own membership rows
    // (see "Caregivers can select their assigned passport" in
    // 0008_passport_caregivers.sql), so this can't return another user's
    // passport even if userId here didn't match the session.
    //
    // Nothing stops a caregiver joining more than one passport (helping
    // more than one friend's pet), and multi-pet caregiver support is out
    // of scope for the pilot — so rather than crash on multiple rows
    // (.maybeSingle() throws if more than one matches), deterministically
    // pick the most recently joined one.
    const asCaregiver = await this.client
      .from("passport_caregivers")
      .select("passports(*)")
      .eq("user_id", userId)
      .order("joined_at", { ascending: false })
      .limit(1);

    if (asCaregiver.error) throw asCaregiver.error;
    const passportRow = asCaregiver.data?.[0]?.passports as unknown as PassportRow | undefined;
    return passportRow ? toPassport(passportRow) : null;
  }
}
