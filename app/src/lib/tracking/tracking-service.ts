import { randomUUID } from "node:crypto";
import { z } from "zod";
import type { PassportRepository } from "../passport/passport-repository";
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
  ownerId: string,
  dateInput: unknown,
  noteInput: unknown,
  passportRepo: PassportRepository,
  trackingRepo: TrackingRepository,
): Promise<TrackingEntry> {
  const date = dateSchema.parse(dateInput);
  const note = noteSchema.parse(noteInput);

  const passport = await passportRepo.findByOwnerId(ownerId);
  if (!passport) {
    throw new Error(`No passport found for owner ${ownerId}`);
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
  ownerId: string,
  passportRepo: PassportRepository,
  trackingRepo: TrackingRepository,
): Promise<TrackingEntry[]> {
  const passport = await passportRepo.findByOwnerId(ownerId);
  if (!passport) return [];

  return trackingRepo.findByPassportId(passport.id);
}
