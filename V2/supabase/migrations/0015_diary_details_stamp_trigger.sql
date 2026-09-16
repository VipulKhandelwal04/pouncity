-- Stamp details_updated_at on the SERVER clock whenever the plan-relevant
-- fields change, so the stale-plan banner compares two server timestamps
-- (diet_plan/grooming_guide created_at are server defaults). Replaces the
-- client-side stamp in updateDiary, which used the device clock and could
-- keep the banner up after a regenerate on a fast device clock.
-- (Applied to production 2026-09-16 as `diary_details_stamp_trigger`.)
create or replace function public.stamp_diary_details_updated()
returns trigger
language plpgsql
set search_path to 'public'
as $$
begin
  if (new.species, new.breed, new.age_label, new.weight_kg)
     is distinct from
     (old.species, old.breed, old.age_label, old.weight_kg) then
    new.details_updated_at := now();
  end if;
  return new;
end;
$$;

drop trigger if exists diary_details_stamp on public.diary;
create trigger diary_details_stamp
  before update on public.diary
  for each row execute function public.stamp_diary_details_updated();
