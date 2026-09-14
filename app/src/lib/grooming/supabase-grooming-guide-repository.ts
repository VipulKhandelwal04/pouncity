import type { SupabaseClient } from "@supabase/supabase-js";
import { PassportScopedArtifactRepository } from "@/lib/supabase/passport-scoped-artifact-repository";
import type { GroomingGuide } from "./grooming-guide";
import type { GroomingGuideRepository } from "./grooming-guide-repository";

interface GroomingGuideRow {
  id: string;
  passport_id: string;
  frequency_guidance: string;
  home_vs_professional_guidance: string;
  disclaimer: string;
  reminder_interval_days: number;
  generated_at: string;
}

function toGroomingGuide(row: GroomingGuideRow): GroomingGuide {
  return {
    id: row.id,
    passportId: row.passport_id,
    frequencyGuidance: row.frequency_guidance,
    homeVsProfessionalGuidance: row.home_vs_professional_guidance,
    disclaimer: row.disclaimer,
    reminderIntervalDays: row.reminder_interval_days,
    generatedAt: row.generated_at,
  };
}

function toRow(passportId: string, guide: GroomingGuide): Record<string, unknown> {
  return {
    id: guide.id,
    passport_id: passportId,
    frequency_guidance: guide.frequencyGuidance,
    home_vs_professional_guidance: guide.homeVsProfessionalGuidance,
    disclaimer: guide.disclaimer,
    reminder_interval_days: guide.reminderIntervalDays,
    generated_at: guide.generatedAt,
  };
}

export class SupabaseGroomingGuideRepository implements GroomingGuideRepository {
  private readonly inner: PassportScopedArtifactRepository<GroomingGuide, GroomingGuideRow>;

  constructor(client: SupabaseClient) {
    this.inner = new PassportScopedArtifactRepository(
      client,
      "grooming_guides",
      toGroomingGuide,
      toRow,
    );
  }

  upsertForPassport(passportId: string, guide: GroomingGuide): Promise<GroomingGuide> {
    return this.inner.upsertForPassport(passportId, guide);
  }

  findByPassportId(passportId: string): Promise<GroomingGuide | null> {
    return this.inner.findByPassportId(passportId);
  }
}
