import { updatePassportOptionalFieldsSchema } from "./update-passport-optional-fields-schema";
import type { PassportRepository } from "./passport-repository";
import type { Passport } from "./passport";

export async function updatePassportOptionalFields(
  ownerId: string,
  input: unknown,
  repo: PassportRepository,
): Promise<Passport> {
  const validated = updatePassportOptionalFieldsSchema.parse(input);

  const existing = await repo.findByOwnerId(ownerId);
  if (!existing) {
    throw new Error(`No passport found for owner ${ownerId}`);
  }

  return repo.update(existing.id, validated);
}
