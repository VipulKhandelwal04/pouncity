import type { CaregiverRepository } from "./caregiver-repository";
import type { Passport } from "./passport";
import { shareTokenSchema } from "./share-token-schema";

export async function joinAsCaregiver(
  userId: string,
  tokenInput: unknown,
  caregiverRepo: CaregiverRepository,
): Promise<Passport> {
  const token = shareTokenSchema.parse(tokenInput);
  return caregiverRepo.join(userId, token);
}
