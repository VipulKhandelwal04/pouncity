import type { Passport } from "./passport";

/**
 * Deliberately separate from PassportRepository: only the handover feature
 * needs to look a passport up by its share token, so keeping this as its
 * own interface means every other feature's test double doesn't have to
 * implement a method it never calls.
 */
export interface PassportShareRepository {
  findByShareToken(token: string): Promise<Passport | null>;
}
