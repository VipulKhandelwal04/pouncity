import { timingSafeEqual } from "node:crypto";

/**
 * A plain `===` on secrets is vulnerable to a timing attack: JS string
 * comparison short-circuits at the first mismatched character, so
 * response-time differences can leak how many leading bytes were correct.
 * crypto.timingSafeEqual takes equal-length buffers, so length is checked
 * separately first (that check itself doesn't leak the secret's content).
 */
export function timingSafeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}
