/**
 * Grooming safety guardrail (ticket 08), mirroring the diet guardrail. Pure +
 * testable. Grooming is lower-risk than diet, but it must not prescribe or
 * diagnose (that is vet territory), the recommended frequency must be sane
 * (it drives reminders), and the copy must be free of em dashes.
 *
 *  - Prescription / diagnosis / medicated-treatment language is REJECTED (the
 *    caller falls back to the templated guide). "See a vet if you notice X" is
 *    fine and does not match these.
 *  - frequencyWeeks is CLAMPED to a sane cadence band.
 *  - Em dashes are stripped from the copy.
 */

import { noEmDash } from "./text";

export interface RawGroomingSuggestion {
  summary: string;
  frequencyWeeks: number;
  routine: string[];
  professional: string;
}

export type GroomingGuardrailResult =
  | {
      ok: true;
      summary: string;
      frequencyWeeks: number;
      routine: string[];
      professional: string;
      clamped: boolean;
    }
  | { ok: false; reason: string };

const MEDICAL_PATTERNS: RegExp[] = [/prescription/i, /\brx\b/i, /diagnos/i, /medicated/i];

const FREQ_MIN = 1;
const FREQ_MAX = 26; // weekly to roughly six-monthly

export function applyGroomingGuardrail(raw: RawGroomingSuggestion): GroomingGuardrailResult {
  const haystack = [raw.summary, raw.professional, ...(raw.routine ?? [])].join(" \n ");
  const hit = MEDICAL_PATTERNS.find((p) => p.test(haystack));
  if (hit) return { ok: false, reason: `medical/prescription content matched ${hit}` };

  const summary = noEmDash((raw.summary ?? "").trim());
  const professional = noEmDash((raw.professional ?? "").trim());
  const routine = (raw.routine ?? [])
    .map((t) => noEmDash(t.trim()))
    .filter(Boolean)
    .slice(0, 8);
  if (!summary && routine.length === 0) return { ok: false, reason: "empty suggestion" };

  const requested = Number.isFinite(raw.frequencyWeeks) ? Math.round(raw.frequencyWeeks) : 8;
  const frequencyWeeks = Math.min(FREQ_MAX, Math.max(FREQ_MIN, requested));

  return {
    ok: true,
    summary,
    frequencyWeeks,
    routine,
    professional: professional || `A professional groom about every ${frequencyWeeks} weeks helps.`,
    clamped: frequencyWeeks !== requested,
  };
}
