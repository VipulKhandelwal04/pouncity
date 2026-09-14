import { randomBytes } from "node:crypto";
import { findOwnedPassportOrThrow } from "./find-owned-passport-or-throw";
import type { PassportRepository } from "./passport-repository";

function generateToken(): string {
  // 32 random bytes, base64url-encoded — ~256 bits of entropy, far beyond
  // what's brute-forceable, and URL-safe with no padding to worry about.
  return randomBytes(32).toString("base64url");
}

/**
 * Generates (or regenerates) the standing share token for the owner's
 * passport and returns it. Regenerating overwrites the previous token,
 * which is what makes "revoke and issue a new link" (Ticket 07) work —
 * the old token simply stops matching anything.
 */
export async function generateHandoverLink(
  ownerId: string,
  passportRepo: PassportRepository,
): Promise<string> {
  const passport = await findOwnedPassportOrThrow(ownerId, passportRepo);

  const token = generateToken();
  await passportRepo.update(passport.id, { shareToken: token });

  return token;
}
