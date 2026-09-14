import type { Passport } from "./passport";

/**
 * Resolves "the passport this user can act on" whether they're the owner
 * or a joined caregiver — the generalization that lets a single tracking
 * action work for both without two code paths.
 */
export interface PassportAccessRepository {
  findAccessiblePassportForUser(userId: string): Promise<Passport | null>;
}
