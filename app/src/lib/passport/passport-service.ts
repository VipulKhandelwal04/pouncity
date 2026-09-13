import { randomUUID } from "node:crypto";
import { createPassportInputSchema } from "./passport-schema";
import type { PassportRepository } from "./passport-repository";
import type { Passport } from "./passport";

export async function createPassport(
  input: unknown,
  ownerId: string,
  repo: PassportRepository,
): Promise<Passport> {
  const validated = createPassportInputSchema.parse(input);

  const passport: Passport = {
    id: randomUUID(),
    ownerId,
    ...validated,
    createdAt: new Date().toISOString(),
  };

  return repo.insert(passport);
}

export async function getPassportForOwner(
  ownerId: string,
  repo: PassportRepository,
): Promise<Passport | null> {
  return repo.findByOwnerId(ownerId);
}
