import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { PassportAccessRepository } from "../passport/passport-access-repository";
import type { TrackingEntry } from "./tracking-entry";
import type { TrackingRepository } from "./tracking-repository";

const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

// A blank/whitespace-only value means "no note provided" (keep whatever
// was there before), not "clear the note" — matches "confirming again the
// same date without a note keeps the previously-set note". A plain HTML
// form always submits the field as "" rather than omitting it, so this
// has to treat "" the same as undefined rather than rejecting it.
const noteSchema = z.preprocess((value) => {
  if (typeof value === "string") {
    const trimmed = value.trim();
    return trimmed === "" ? undefined : trimmed;
  }
  return value;
}, z.string().min(1).optional());

export async function confirmFedToday(
  userId: string,
  dateInput: unknown,
  noteInput: unknown,
  passportAccessRepo: PassportAccessRepository,
  trackingRepo: TrackingRepository,
): Promise<TrackingEntry> {
  const date = dateSchema.parse(dateInput);
  const note = noteSchema.parse(noteInput);

  const passport = await passportAccessRepo.findAccessiblePassportForUser(userId);
  if (!passport) {
    throw new Error(`No accessible passport found for user ${userId}`);
  }

  const existing = await trackingRepo.findByPassportIdAndDate(passport.id, date);

  const entry: TrackingEntry = {
    id: existing?.id ?? randomUUID(),
    passportId: passport.id,
    date,
    note: note ?? existing?.note ?? null,
    confirmedAt: existing?.confirmedAt ?? new Date().toISOString(),
  };

  return trackingRepo.upsertForDate(passport.id, entry);
}

export async function getTrackingHistory(
  userId: string,
  passportAccessRepo: PassportAccessRepository,
  trackingRepo: TrackingRepository,
): Promise<TrackingEntry[]> {
  const passport = await passportAccessRepo.findAccessiblePassportForUser(userId);
  if (!passport) return [];

  return trackingRepo.findByPassportId(passport.id);
}
