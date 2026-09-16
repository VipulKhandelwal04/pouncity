/**
 * Diet safety guardrail (ticket 07). Pure + dependency-free so it can be unit
 * tested with a stubbed model output. Product hard-rail: feeding guidance is
 * vet-constrained and NEVER a prescription / therapeutic / condition-specific
 * diet. The model's raw suggestion passes through here before anything is saved.
 *
 * Two kinds of constraint:
 *  - Prescription-style content is REJECTED (the caller falls back to the safe
 *    templated plan) — we don't try to partially rewrite medical claims.
 *  - The daily portion is CLAMPED to a sane grams-per-kg band for the species,
 *    so an out-of-range number can never reach the owner.
 *  - Em dashes are stripped from the copy (noEmDash, shared with grooming).
 */

import { noEmDash } from "./text";

export type Species = "dog" | "cat";

export interface RawDietSuggestion {
  summary: string;
  /** Approximate daily dry-food grams the model proposed. */
  portionGramsPerDay: number;
  meals: string;
  tips: string[];
}

export interface DietGuardrailContext {
  species: Species;
  weightKg: number | null;
}

export type DietGuardrailResult =
  | { ok: true; summary: string; portionPerDay: string; meals: string; tips: string[]; clamped: boolean }
  | { ok: false; reason: string };

/** Prescription / therapeutic / condition-specific diet language — out of bounds. */
const PRESCRIPTION_PATTERNS: RegExp[] = [
  /prescription/i,
  /\brx\b/i,
  /therapeutic diet/i,
  /veterinary diet/i,
  /hydrolyz(ed|ised)/i,
  /renal (diet|support|care)/i,
  /kidney (diet|disease|support)/i,
  /urinary (diet|so\b|s\/o)/i,
  /gastrointestinal diet/i,
  /hepatic diet/i,
  /diabetic diet/i,
  /\b[ikcz]\/d\b/i, // Hill's i/d, k/d, c/d, z/d style codes
];

/** Sane daily grams-per-kg band by species (generous maintenance range). */
const GRAMS_PER_KG: Record<Species, [number, number]> = {
  dog: [10, 35],
  cat: [12, 30],
};

export function applyDietGuardrail(
  raw: RawDietSuggestion,
  ctx: DietGuardrailContext
): DietGuardrailResult {
  const haystack = [raw.summary, raw.meals, ...(raw.tips ?? [])].join(" \n ");
  const hit = PRESCRIPTION_PATTERNS.find((p) => p.test(haystack));
  if (hit) return { ok: false, reason: `prescription-style content matched ${hit}` };

  const summary = noEmDash((raw.summary ?? "").trim());
  const meals = noEmDash((raw.meals ?? "").trim());
  if (!summary && !meals) return { ok: false, reason: "empty suggestion" };

  const defaultWeight = ctx.species === "dog" ? 15 : 4;
  const w = ctx.weightKg && ctx.weightKg > 0 ? ctx.weightKg : defaultWeight;
  const [lo, hi] = GRAMS_PER_KG[ctx.species];
  const lower = Math.round(lo * w);
  const upper = Math.round(hi * w);
  const requested = Number.isFinite(raw.portionGramsPerDay)
    ? Math.round(raw.portionGramsPerDay)
    : lower;
  const grams = Math.min(upper, Math.max(lower, requested));

  return {
    ok: true,
    summary,
    portionPerDay: `About ${grams} g of dry food a day`,
    meals: meals || "2 meals, morning and evening",
    tips: (raw.tips ?? []).map((t) => noEmDash(t.trim())).filter(Boolean).slice(0, 6),
    clamped: grams !== requested,
  };
}
