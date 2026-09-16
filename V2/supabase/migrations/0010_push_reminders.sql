-- Ticket 09: Web Push subscription + reminder preferences on Supabase.
-- Both are private to the person (account_id = auth.uid()). The ticket-10
-- scheduler reads them via the service role to decide + send reminders.

-- ---- push_subscription: one Web Push endpoint per device the person opted in on

create table if not exists public.push_subscription (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.account (id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

alter table public.push_subscription enable row level security;

create policy "push_subscription: owner reads"
  on public.push_subscription for select using (account_id = auth.uid());
create policy "push_subscription: owner inserts"
  on public.push_subscription for insert with check (account_id = auth.uid());
create policy "push_subscription: owner updates"
  on public.push_subscription for update using (account_id = auth.uid()) with check (account_id = auth.uid());
create policy "push_subscription: owner deletes"
  on public.push_subscription for delete using (account_id = auth.uid());

-- ---- reminder_pref: per person, per Diary — feeding + grooming reminder on/off
-- Each member (Owner and any Caregiver) has their OWN row per diary, so they
-- each control their own reminders (ADR: per-(account,diary)).

create table if not exists public.reminder_pref (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.account (id) on delete cascade,
  diary_id uuid not null references public.diary (id) on delete cascade,
  feeding_enabled boolean not null default false,
  grooming_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  unique (account_id, diary_id)
);

alter table public.reminder_pref enable row level security;

create policy "reminder_pref: owner reads"
  on public.reminder_pref for select using (account_id = auth.uid());
create policy "reminder_pref: owner inserts"
  on public.reminder_pref for insert with check (account_id = auth.uid());
create policy "reminder_pref: owner updates"
  on public.reminder_pref for update using (account_id = auth.uid()) with check (account_id = auth.uid());
create policy "reminder_pref: owner deletes"
  on public.reminder_pref for delete using (account_id = auth.uid());

grant select, insert, update, delete on public.push_subscription, public.reminder_pref
  to authenticated, service_role;
