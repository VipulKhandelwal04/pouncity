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
}
