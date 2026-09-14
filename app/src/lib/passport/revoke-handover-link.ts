import { findOwnedPassportOrThrow } from "./find-owned-passport-or-throw";
import type { PassportRepository } from "./passport-repository";

/**
 * Clears the standing share token so the current link stops resolving
 * immediately. Owner-initiated only — matches the earlier design decision
 * that revocation is manual, not auto-expiring.
 */
export async function revokeHandoverLink(
  ownerId: string,
  passportRepo: PassportRepository,
): Promise<void> {
  const passport = await findOwnedPassportOrThrow(ownerId, passportRepo);
  await passportRepo.update(passport.id, { shareToken: null });
}
