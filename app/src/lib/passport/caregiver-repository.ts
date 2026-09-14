import type { Passport } from "./passport";

export interface CaregiverRepository {
  /**
   * Joins the given user as a caregiver on whatever passport the token
   * currently points to, and returns that passport. Throws if the token
   * doesn't match a currently-active link. Idempotent — joining again with
   * a still-valid token for a passport you're already a caregiver of just
   * returns the same passport.
   */
  join(userId: string, token: string): Promise<Passport>;
}
