import { z } from "zod";

export const createPassportInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  species: z.enum(["dog", "cat"]),
  breed: z.string().trim().min(1, "Breed is required"),
  birthDate: z.string().trim().min(1, "Birth date is required"),
  weightKg: z.number().positive("Weight must be greater than zero"),
  photoUrl: z.string().trim().min(1, "Photo is required"),
});

export type CreatePassportInput = z.infer<typeof createPassportInputSchema>;
