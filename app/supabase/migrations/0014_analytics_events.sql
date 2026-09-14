-- Ticket 10: pilot analytics instrumentation.
--
-- Four of the five events happen in an authenticated context (owner or
-- caregiver) and go through the normal RLS-scoped insert path below.
-- handover_link_opened is the exception — it happens on the fully
-- unauthenticated /share/[token] page — so it goes through a
-- SECURITY DEFINER RPC that verifies the token matches an active passport
-- server-side before recording anything, same reasoning as the other
-- token-gated RPCs in this codebase (0006, 0008).

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  passport_id uuid not null references public.passports (id) on delete cascade,
  event_name text not null check (
    event_name in (
      'diet_plan_generated',
      'diet_plan_viewed',
      'daily_tracking_tap',
      'handover_link_created',
      'handover_link_opened'
    )
  ),
  occurred_at timestamptz not null default now()
);

alter table public.analytics_events enable row level security;

-- Owners and caregivers can record events for their own/assigned passport
-- (covers diet_plan_generated, diet_plan_viewed, daily_tracking_tap,
-- handover_link_created). No select policy — this table is written by the
-- app and read only via the service-role-backed dashboard route; there's
-- no product surface that shows a single user their own event history.
create policy "Owners can record events for their own passport"
  on public.analytics_events for insert
  with check (public.owns_passport(passport_id));

create policy "Caregivers can record events for their assigned passport"
  on public.analytics_events for insert
  with check (public.is_caregiver_of_passport(passport_id));

create or replace function public.record_handover_opened(p_token text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  matched_id uuid;
begin
  select id into matched_id from public.passports where share_token = p_token;

  if matched_id is not null then
    insert into public.analytics_events (passport_id, event_name)
    values (matched_id, 'handover_link_opened');
  end if;
  -- Silently no-ops for an invalid/revoked token rather than raising —
  -- unlike join_passport_as_caregiver, a failed view-tracking call
  -- shouldn't surface as an error to someone just looking at a page.
end;
$$;
