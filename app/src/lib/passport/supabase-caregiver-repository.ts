import type { SupabaseClient } from "@supabase/supabase-js";
import type { Passport } from "./passport";
import type { CaregiverRepository } from "./caregiver-repository";
import { toPassport, type PassportRow } from "./supabase-passport-repository";

export class SupabaseCaregiverRepository implements CaregiverRepository {
  constructor(private readonly client: SupabaseClient) {}

  async join(_userId: string, token: string): Promise<Passport> {
    // userId is unused here — the RPC uses auth.uid() from the session's
    // own JWT server-side, which is the actual security boundary. A
    // client-supplied userId is only meaningful for the in-memory test
    // double; trusting it here would defeat the point.
    const { data, error } = await this.client.rpc("join_passport_as_caregiver", {
      p_token: token,
    });

    if (error) throw error;
    return toPassport(data as PassportRow);
  }
}
