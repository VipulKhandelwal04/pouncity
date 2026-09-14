export type Species = "dog" | "cat";

export interface Passport {
  id: string;
  ownerId: string;
  name: string;
  species: Species;
  breed: string;
  birthDate: string;
  weightKg: number;
  photoUrl: string;
  createdAt: string;
  quirks: string | null;
  vetName: string | null;
  vetPhone: string | null;
  vetClinic: string | null;
  /**
   * Standing, unguessable token for the handover link. Null means no link
   * has been generated (or it was revoked). Never expires on its own —
   * only regenerating or revoking invalidates it.
   */
  shareToken: string | null;
}

/** The optional passport fields tracked by the "complete your passport" nudge. */
export const OPTIONAL_PASSPORT_FIELDS = [
  "quirks",
  "vetName",
  "vetPhone",
  "vetClinic",
] as const;
