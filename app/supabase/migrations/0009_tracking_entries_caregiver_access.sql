-- Ticket 08 follow-up: tracking_entries (Ticket 04, already live) only
-- ever granted owner access via owns_passport(). The app layer now
-- resolves "owner or caregiver" through PassportAccessRepository, but
-- without these, a caregiver's tracking writes/reads would be silently
-- rejected by RLS despite every application-level check passing — this
-- is exactly the gap that made the ticket's core feature non-functional
-- until caught in review.

create policy "Caregivers can insert tracking entries for their assigned passport"
  on public.tracking_entries for insert
  with check (public.is_caregiver_of_passport(passport_id));

create policy "Caregivers can select tracking entries for their assigned passport"
  on public.tracking_entries for select
  using (public.is_caregiver_of_passport(passport_id));

create policy "Caregivers can update tracking entries for their assigned passport"
  on public.tracking_entries for update
  using (public.is_caregiver_of_passport(passport_id));
