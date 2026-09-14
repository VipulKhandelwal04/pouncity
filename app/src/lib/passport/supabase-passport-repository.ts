import type { SupabaseClient } from "@supabase/supabase-js";
import type { Passport } from "./passport";
import type { PassportRepository } from "./passport-repository";
import type { PassportShareRepository } from "./passport-share-repository";

interface PassportRow {
  id: string;
  owner_id: string;
  name: string;
  species: "dog" | "cat";
  breed: string;
  birth_date: string;
  weight_kg: number;
  photo_url: string;
  created_at: string;
  quirks: string | null;
  vet_name: string | null;
  vet_phone: string | null;
  vet_clinic: string | null;
  share_token: string | null;
}

function toPassport(row: PassportRow): Passport {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    species: row.species,
    breed: row.breed,
    birthDate: row.birth_date,
    weightKg: row.weight_kg,
    photoUrl: row.photo_url,
    createdAt: row.created_at,
    quirks: row.quirks,
    vetName: row.vet_name,
    vetPhone: row.vet_phone,
    vetClinic: row.vet_clinic,
    shareToken: row.share_token,
  };
}

function toRow(updates: Partial<Passport>): Partial<PassportRow> {
  const row: Partial<PassportRow> = {};
  if (updates.name !== undefined) row.name = updates.name;
  if (updates.species !== undefined) row.species = updates.species;
  if (updates.breed !== undefined) row.breed = updates.breed;
  if (updates.birthDate !== undefined) row.birth_date = updates.birthDate;
  if (updates.weightKg !== undefined) row.weight_kg = updates.weightKg;
  if (updates.photoUrl !== undefined) row.photo_url = updates.photoUrl;
  if (updates.quirks !== undefined) row.quirks = updates.quirks;
  if (updates.vetName !== undefined) row.vet_name = updates.vetName;
  if (updates.vetPhone !== undefined) row.vet_phone = updates.vetPhone;
  if (updates.vetClinic !== undefined) row.vet_clinic = updates.vetClinic;
  if (updates.shareToken !== undefined) row.share_token = updates.shareToken;
  return row;
}

export class SupabasePassportRepository
  implements PassportRepository, PassportShareRepository
{
  constructor(private readonly client: SupabaseClient) {}

  async insert(passport: Passport): Promise<Passport> {
    // toRow() maps every updatable field; a full Passport has none of them
    // undefined, so this covers the same fields insert() needs without
    // duplicating the camelCase-to-snake_case mapping a second time.
    const { data, error } = await this.client
      .from("passports")
      .insert({
        id: passport.id,
        owner_id: passport.ownerId,
        created_at: passport.createdAt,
        ...toRow(passport),
      })
      .select()
      .single();

    if (error) throw error;
    return toPassport(data as PassportRow);
  }

  async findByOwnerId(ownerId: string): Promise<Passport | null> {
    const { data, error } = await this.client
      .from("passports")
      .select()
      .eq("owner_id", ownerId)
      .maybeSingle();

    if (error) throw error;
    return data ? toPassport(data as PassportRow) : null;
  }

  async update(id: string, updates: Partial<Passport>): Promise<Passport> {
    const { data, error } = await this.client
      .from("passports")
      .update(toRow(updates))
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return toPassport(data as PassportRow);
  }

  async findByShareToken(token: string): Promise<Passport | null> {
    // A plain table select would be blocked by RLS for an unauthenticated
    // caller (correctly — there's no "anyone can read by token" policy on
    // the table itself). This RPC is the deliberate, narrow exception.
    const { data, error } = await this.client.rpc("get_passport_by_share_token", {
      p_token: token,
    });

    if (error) throw error;

    // For a SQL-language function whose return type is a single composite
    // row (not SETOF), Postgres represents "the query matched zero rows"
    // as a row where every field is null — not SQL/JSON null itself.
    // PostgREST serializes that as a truthy object like
    // { id: null, owner_id: null, ... }, so `!data` never catches a
    // non-matching token; checking the row's own primary key does.
    const row = data as PassportRow | null;
    if (!row || row.id === null) return null;

    return toPassport(row);
  }
}
