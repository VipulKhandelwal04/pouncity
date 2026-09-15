-- Ticket 02: real auth + core persistence (Account + Diary), per
-- V2/backend_logic/README.md's Data model section.
-- Run this once in the Supabase project's SQL Editor.

-- ---- account --------------------------------------------------------------

create table if not exists public.account (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);

alter table public.account enable row level security;

create policy "account: read own row"
  on public.account for select
  using (auth.uid() = id);

create policy "account: update own row"
  on public.account for update
  using (auth.uid() = id);

create policy "account: insert own row"
  on public.account for insert
  with check (auth.uid() = id);

-- Auto-create the account row the moment someone signs up, so the app never
-- has to special-case "authed but no account row yet".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.account (id, email)
  values (new.id, coalesce(new.email, ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---- diary ------------------------------------------------------------

create table if not exists public.diary (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  species text not null check (species in ('dog', 'cat')),
  breed text not null default '',
  age_label text not null default '',
  weight_kg numeric,
  photo_url text,
  quirks text,
  vet_name text,
  vet_phone text,
  vet_clinic text,
  neuter_status text not null default 'none' check (neuter_status in ('neutered', 'spayed', 'none')),
  registered boolean not null default false,
  rabies_vaccinated boolean not null default false,
  rabies_certificate_url text,
  rabies_expiry date,
  current_food text,
  coat_type text,
  created_at timestamptz not null default now()
);

alter table public.diary enable row level security;

-- ---- membership ---------------------------------------------------------

create table if not exists public.membership (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.account (id) on delete cascade,
  diary_id uuid not null references public.diary (id) on delete cascade,
  role text not null check (role in ('owner', 'caregiver')),
  created_at timestamptz not null default now(),
  unique (account_id, diary_id)
);

-- One Owner and one Caregiver per pet (ADR-0007).
create unique index if not exists membership_one_owner_per_diary
  on public.membership (diary_id) where role = 'owner';
create unique index if not exists membership_one_caregiver_per_diary
  on public.membership (diary_id) where role = 'caregiver';

alter table public.membership enable row level security;

create policy "membership: read own rows"
  on public.membership for select
  using (auth.uid() = account_id);

create policy "membership: insert own row"
  on public.membership for insert
  with check (auth.uid() = account_id);

create policy "membership: delete own row"
  on public.membership for delete
  using (auth.uid() = account_id);

-- diary policies reference membership, so they're declared after it.
create policy "diary: member reads"
  on public.diary for select
  using (
    exists (
      select 1 from public.membership m
      where m.diary_id = diary.id and m.account_id = auth.uid()
    )
  );

create policy "diary: owner inserts"
  on public.diary for insert
  with check (true); -- ownership is granted by the membership row inserted alongside it

create policy "diary: owner updates"
  on public.diary for update
  using (
    exists (
      select 1 from public.membership m
      where m.diary_id = diary.id and m.account_id = auth.uid() and m.role = 'owner'
    )
  );

-- ---- storage buckets ------------------------------------------------------

insert into storage.buckets (id, name, public)
values ('pet-photos', 'pet-photos', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('rabies-certificates', 'rabies-certificates', false)
on conflict (id) do nothing;

-- Objects are stored under `{diary_id}/...`; access follows diary membership.
create policy "pet-photos: member reads"
  on storage.objects for select
  using (
    bucket_id = 'pet-photos'
    and exists (
      select 1 from public.membership m
      where m.diary_id::text = (storage.foldername(name))[1] and m.account_id = auth.uid()
    )
  );

create policy "pet-photos: owner writes"
  on storage.objects for insert
  with check (
    bucket_id = 'pet-photos'
    and exists (
      select 1 from public.membership m
      where m.diary_id::text = (storage.foldername(name))[1]
        and m.account_id = auth.uid() and m.role = 'owner'
    )
  );

create policy "pet-photos: owner replaces"
  on storage.objects for update
  using (
    bucket_id = 'pet-photos'
    and exists (
      select 1 from public.membership m
      where m.diary_id::text = (storage.foldername(name))[1]
        and m.account_id = auth.uid() and m.role = 'owner'
    )
  );

create policy "rabies-certificates: member reads"
  on storage.objects for select
  using (
    bucket_id = 'rabies-certificates'
    and exists (
      select 1 from public.membership m
      where m.diary_id::text = (storage.foldername(name))[1] and m.account_id = auth.uid()
    )
  );

create policy "rabies-certificates: owner writes"
  on storage.objects for insert
  with check (
    bucket_id = 'rabies-certificates'
    and exists (
      select 1 from public.membership m
      where m.diary_id::text = (storage.foldername(name))[1]
        and m.account_id = auth.uid() and m.role = 'owner'
    )
  );

create policy "rabies-certificates: owner replaces"
  on storage.objects for update
  using (
    bucket_id = 'rabies-certificates'
    and exists (
      select 1 from public.membership m
      where m.diary_id::text = (storage.foldername(name))[1]
        and m.account_id = auth.uid() and m.role = 'owner'
    )
  );
