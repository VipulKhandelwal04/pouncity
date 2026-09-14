import { z } from "zod";
import type { PassportShareRepository } from "./passport-share-repository";
import { toSharedPassportView, type SharedPassportView } from "./shared-passport-view";

const tokenSchema = z.string().trim().min(1);

export async function getPassportByShareToken(
  tokenInput: unknown,
  shareRepo: PassportShareRepository,
): Promise<SharedPassportView | null> {
  const parsed = tokenSchema.safeParse(tokenInput);
  if (!parsed.success) return null;

  const passport = await shareRepo.findByShareToken(parsed.data);
  return passport ? toSharedPassportView(passport) : null;
}
