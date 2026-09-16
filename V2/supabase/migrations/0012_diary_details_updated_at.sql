-- When the pet's plan-relevant core details (species/breed/age/weight) last
-- changed via Edit pet. Null = never edited since creation. The diet and
-- grooming screens compare this to their plan's created_at and offer a
-- regenerate when the plan predates the change.
-- (Applied to production 2026-09-16 as `diary_details_updated_at`.)
alter table public.diary add column if not exists details_updated_at timestamptz;
