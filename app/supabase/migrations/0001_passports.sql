-- Ticket 01: Account creation + Passport creation (core fields)
-- One passport per owner for the pilot (single-pet scope).

create table if not exists public.passports (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  species text not null check (species in ('dog', 'cat')),
  breed text not null,
  birth_date date not null,
  weight_kg numeric not null check (weight_kg > 0),
  photo_url text not null,
  created_at timestamptz not null default now(),
  constraint one_passport_per_owner unique (owner_id)
);

alter table public.passports enable row level security;

-- Owner can create their own passport.
create policy "Owners can insert their own passport"
  on public.passports for insert
  with check (auth.uid() = owner_id);

-- Owner can read their own passport.
create policy "Owners can select their own passport"
  on public.passports for select
  using (auth.uid() = owner_id);

-- Owner can update their own passport (used by later tickets for optional fields).
create policy "Owners can update their own passport"
  on public.passports for update
  using (auth.uid() = owner_id);
