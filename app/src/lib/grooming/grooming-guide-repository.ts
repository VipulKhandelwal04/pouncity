import type { GroomingGuide } from "./grooming-guide";

export interface GroomingGuideRepository {
  upsertForPassport(passportId: string, guide: GroomingGuide): Promise<GroomingGuide>;
  findByPassportId(passportId: string): Promise<GroomingGuide | null>;
}
