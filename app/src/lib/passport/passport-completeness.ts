import { OPTIONAL_PASSPORT_FIELDS, type Passport } from "./passport";

export interface PassportCompleteness {
  filled: number;
  total: number;
  missing: Array<(typeof OPTIONAL_PASSPORT_FIELDS)[number]>;
}

export function passportCompleteness(passport: Passport): PassportCompleteness {
  const missing = OPTIONAL_PASSPORT_FIELDS.filter((field) => !passport[field]);

  return {
    filled: OPTIONAL_PASSPORT_FIELDS.length - missing.length,
    total: OPTIONAL_PASSPORT_FIELDS.length,
    missing,
  };
}
