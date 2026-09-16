/**
 * Strip em dashes from model copy — the brand forbids them (classic AI slop).
 * En dashes in numeric ranges like "4-6 weeks" are allowed and left untouched;
 * only the em dash (U+2014), horizontal bar (U+2015), and spaced double-hyphens
 * are replaced (with a comma), then whitespace and doubled commas are tidied.
 * Shared by the diet and grooming guardrails.
 */
export function noEmDash(s: string): string {
  return s
    .replace(/\s*[—―]\s*/g, ", ")
    .replace(/ -- /g, ", ")
    .replace(/\s*,\s*,\s*/g, ", ")
    .replace(/\s+/g, " ")
    .trim();
}
