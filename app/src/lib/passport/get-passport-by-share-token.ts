import type { PassportShareRepository } from "./passport-share-repository";
import { shareTokenSchema } from "./share-token-schema";
import { toSharedPassportView, type SharedPassportView } from "./shared-passport-view";

export async function getPassportByShareToken(
  tokenInput: unknown,
  shareRepo: PassportShareRepository,
): Promise<SharedPassportView | null> {
  const parsed = shareTokenSchema.safeParse(tokenInput);
  if (!parsed.success) return null;

  const passport = await shareRepo.findByShareToken(parsed.data);
  return passport ? toSharedPassportView(passport) : null;
}
