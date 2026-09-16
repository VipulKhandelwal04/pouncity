-- Ticket 11: pilot analytics. Five events, each tagged with the belief it tests.
-- Written by the client track() seam (own rows) and by the public handover route
-- (service role, for handover_opened). The team reads the report via the service
-- role, so there is no broad user-facing SELECT — a user only sees their own rows
-- (needed for the once-per-day dedupe).

create table if not exists public.analytics_event (
  id bigint generated always as identity primary key,
  name text not null,
  belief text not null,
  account_id uuid references public.account (id) on delete set null,
  diary_id uuid references public.diary (id) on delete set null,
  recipient_key text,
  props jsonb,
  created_at timestamptz not null default now()
);

-- Report + dedupe queries filter on these.
create index if not exists analytics_event_name_created_idx on public.analytics_event (name, created_at);
create index if not exists analytics_event_diary_idx on public.analytics_event (diary_id);

alter table public.analytics_event enable row level security;

-- A signed-in person writes their own events and can read them back (the
-- daily-tap dedupe reads today's own events). No cross-user read: the team
-- report runs via the service role.
create policy "analytics_event: insert own"
  on public.analytics_event for insert
  with check (account_id = auth.uid());

create policy "analytics_event: read own"
  on public.analytics_event for select
  using (account_id = auth.uid());

grant select, insert on public.analytics_event to authenticated;
grant select, insert, update, delete on public.analytics_event to service_role;
