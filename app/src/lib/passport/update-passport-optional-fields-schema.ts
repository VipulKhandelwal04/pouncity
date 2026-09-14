import { z } from "zod";

/**
 * A field where: undefined = leave untouched, null or blank/whitespace-only
 * string = clear the field to null, any other string = set that (trimmed)
 * value. Distinguishing "not provided" from "provided but empty" is what
 * lets a caller explicitly clear a previously-set value.
 */
const clearableStringField = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? null : trimmed;
  }
  return value;
}, z.string().min(1).nullable().optional());

export const updatePassportOptionalFieldsSchema = z.object({
  quirks: clearableStringField,
  vetName: clearableStringField,
  vetPhone: clearableStringField,
  vetClinic: clearableStringField,
});

export type UpdatePassportOptionalFieldsInput = z.infer<
  typeof updatePassportOptionalFieldsSchema
>;
