import type { SupabaseClient } from "@supabase/supabase-js";
import type { Passport } from "./passport";
import type { PassportRepository } from "./passport-repository";

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
  };
}

export class SupabasePassportRepository implements PassportRepository {
  constructor(private readonly client: SupabaseClient) {}

  async insert(passport: Passport): Promise<Passport> {
    const { data, error } = await this.client
      .from("passports")
      .insert({
        id: passport.id,
        owner_id: passport.ownerId,
        name: passport.name,
        species: passport.species,
        breed: passport.breed,
        birth_date: passport.birthDate,
        weight_kg: passport.weightKg,
        photo_url: passport.photoUrl,
        created_at: passport.createdAt,
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
}
