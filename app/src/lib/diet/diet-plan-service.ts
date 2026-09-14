import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { PassportRepository } from "../passport/passport-repository";
import type { DietPlan, DietPlanGenerator } from "./diet-plan";
import type { DietPlanRepository } from "./diet-plan-repository";

const currentFoodSchema = z.string().trim().min(1, "Current food is required");

export async function generateDietPlan(
  ownerId: string,
  currentFoodInput: unknown,
  passportRepo: PassportRepository,
  dietRepo: DietPlanRepository,
  generator: DietPlanGenerator,
): Promise<DietPlan> {
  const currentFood = currentFoodSchema.parse(currentFoodInput);

  const passport = await passportRepo.findByOwnerId(ownerId);
  if (!passport) {
    throw new Error(`No passport found for owner ${ownerId}`);
  }

  const content = await generator.generate({
    species: passport.species,
    breed: passport.breed,
    birthDate: passport.birthDate,
    weightKg: passport.weightKg,
    currentFood,
  });

  // Regenerating replaces the content of "the" plan for this passport, not
  // its identity — reuse the existing id if one exists so anything that
  // references a plan by id (a share link, a client cache) doesn't break
  // every time the owner regenerates.
  const existing = await dietRepo.findByPassportId(passport.id);

  const plan: DietPlan = {
    id: existing?.id ?? randomUUID(),
    passportId: passport.id,
    currentFood,
    ...content,
    generatedAt: new Date().toISOString(),
  };

  return dietRepo.upsertForPassport(passport.id, plan);
}

export async function getDietPlanForPassport(
  ownerId: string,
  passportRepo: PassportRepository,
  dietRepo: DietPlanRepository,
): Promise<DietPlan | null> {
  const passport = await passportRepo.findByOwnerId(ownerId);
  if (!passport) return null;

  return dietRepo.findByPassportId(passport.id);
}
