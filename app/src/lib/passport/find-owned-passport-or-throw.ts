import type { Passport } from "./passport";
import type { PassportRepository } from "./passport-repository";

export async function findOwnedPassportOrThrow(
  ownerId: string,
  passportRepo: PassportRepository,
): Promise<Passport> {
  const passport = await passportRepo.findByOwnerId(ownerId);
  if (!passport) {
    throw new Error(`No passport found for owner ${ownerId}`);
  }
  return passport;
}
