import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Shared query logic for the "one row per passport, upsert on regenerate,
 * keep the domain object's own id stable across regeneration" shape used
 * by both diet plans and grooming guides (and likely future generated
 * artifacts). Only the row<->domain mapping differs per entity, so that's
 * the only thing callers provide.
 */
export class PassportScopedArtifactRepository<TDomain, TRow> {
  constructor(
    private readonly client: SupabaseClient,
    private readonly table: string,
    private readonly toDomain: (row: TRow) => TDomain,
    private readonly toRow: (passportId: string, domain: TDomain) => Record<string, unknown>,
  ) {}

  async upsertForPassport(passportId: string, domain: TDomain): Promise<TDomain> {
    const { data, error } = await this.client
      .from(this.table)
      .upsert(this.toRow(passportId, domain), { onConflict: "passport_id" })
      .select()
      .single();

    if (error) throw error;
    return this.toDomain(data as TRow);
  }

  async findByPassportId(passportId: string): Promise<TDomain | null> {
    const { data, error } = await this.client
      .from(this.table)
      .select()
      .eq("passport_id", passportId)
      .maybeSingle();

    if (error) throw error;
    return data ? this.toDomain(data as TRow) : null;
  }
}
