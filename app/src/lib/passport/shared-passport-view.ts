import type { Passport, Species } from "./passport";

/**
 * What an anonymous viewer of a handover link is allowed to see.
 * Deliberately excludes ownerId (an internal auth.users id) and
 * shareToken (the bearer secret itself) — the point of this type is that
 * "add a field to Passport" can never silently leak either of those to an
 * unauthenticated viewer without a compile error forcing a conscious
 * decision here.
 */
export interface SharedPassportView {
  id: string;
  name: string;
  species: Species;
  breed: string;
  birthDate: string;
  weightKg: number;
  photoUrl: string;
  createdAt: string;
  quirks: string | null;
  vetName: string | null;
  vetPhone: string | null;
  vetClinic: string | null;
}

export function toSharedPassportView(passport: Passport): SharedPassportView {
  return {
    id: passport.id,
    name: passport.name,
    species: passport.species,
    breed: passport.breed,
    birthDate: passport.birthDate,
    weightKg: passport.weightKg,
    photoUrl: passport.photoUrl,
    createdAt: passport.createdAt,
    quirks: passport.quirks,
    vetName: passport.vetName,
    vetPhone: passport.vetPhone,
    vetClinic: passport.vetClinic,
  };
}
