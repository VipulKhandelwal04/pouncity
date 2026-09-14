import { randomUUID } from "node:crypto";
import type { PassportRepository } from "../passport/passport-repository";
import type { GroomingGuide, GroomingGuideGenerator } from "./grooming-guide";
import type { GroomingGuideRepository } from "./grooming-guide-repository";

export async function generateGroomingGuide(
  ownerId: string,
  passportRepo: PassportRepository,
  groomingRepo: GroomingGuideRepository,
  generator: GroomingGuideGenerator,
): Promise<GroomingGuide> {
  const passport = await passportRepo.findByOwnerId(ownerId);
  if (!passport) {
    throw new Error(`No passport found for owner ${ownerId}`);
  }

  const content = await generator.generate({
    species: passport.species,
    breed: passport.breed,
  });

  // Regenerating replaces the content of "the" guide for this passport, not
  // its identity — same reasoning as diet-plan-service.ts.
  const existing = await groomingRepo.findByPassportId(passport.id);

  const guide: GroomingGuide = {
    id: existing?.id ?? randomUUID(),
    passportId: passport.id,
    ...content,
    generatedAt: new Date().toISOString(),
  };

  return groomingRepo.upsertForPassport(passport.id, guide);
}

export async function getGroomingGuideForPassport(
  ownerId: string,
  passportRepo: PassportRepository,
  groomingRepo: GroomingGuideRepository,
): Promise<GroomingGuide | null> {
  const passport = await passportRepo.findByOwnerId(ownerId);
  if (!passport) return null;

  return groomingRepo.findByPassportId(passport.id);
}
