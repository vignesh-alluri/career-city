-- Career City: Phase 6 schema
-- Enums
create type public.application_status as enum
  ('saved','applied','assessment','interview','offered','accepted','rejected');
create type public.reminder_type as enum
  ('interview','follow_up','deadline','custom');

-- Shared trigger function: keep updated_at current
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) <= 80),
  created_at timestamptz not null default now()
);

-- applications
create table public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  company text not null check (char_length(btrim(company)) between 1 and 120),
  role text not null check (char_length(btrim(role)) between 1 and 160),
  company_website text check (company_website is null or char_length(company_website) <= 300),
  job_description text check (job_description is null or char_length(job_description) <= 10000),
  application_url text check (application_url is null or char_length(application_url) <= 500),
  location text check (location is null or char_length(location) <= 120),
  employment_type text check (employment_type is null or char_length(employment_type) <= 40),
  status public.application_status not null default 'saved',
  date_applied date,
  deadline date,
  notes text check (notes is null or char_length(notes) <= 4000),
  board_position double precision not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- any status other than saved needs an applied date (mirrors the form rule)
  constraint applications_date_applied_required
    check (status = 'saved' or date_applied is not null)
);
create index applications_user_status_idx on public.applications (user_id, status);
create index applications_user_deadline_idx on public.applications (user_id, deadline);
create trigger applications_set_updated_at
  before update on public.applications
  for each row execute function public.set_updated_at();

-- reminders
create table public.reminders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  application_id uuid references public.applications (id) on delete cascade,
  type public.reminder_type not null default 'custom',
  title text not null check (char_length(btrim(title)) between 1 and 160),
  due_at timestamptz not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index reminders_user_due_idx on public.reminders (user_id, due_at);
create index reminders_application_idx on public.reminders (application_id);
create trigger reminders_set_updated_at
  before update on public.reminders
  for each row execute function public.set_updated_at();

-- Auto-create a profile when someone signs up
create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(left(new.raw_user_meta_data ->> 'display_name', 80), ''));
  return new;
end;
$$;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Row Level Security
alter table public.profiles enable row level security;
alter table public.applications enable row level security;
alter table public.reminders enable row level security;

create policy "profiles_select_own" on public.profiles
  for select to authenticated using ((select auth.uid()) = id);
create policy "profiles_update_own" on public.profiles
  for update to authenticated
  using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

create policy "applications_select_own" on public.applications
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "applications_insert_own" on public.applications
  for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "applications_update_own" on public.applications
  for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "applications_delete_own" on public.applications
  for delete to authenticated using ((select auth.uid()) = user_id);

create policy "reminders_select_own" on public.reminders
  for select to authenticated using ((select auth.uid()) = user_id);
create policy "reminders_insert_own" on public.reminders
  for insert to authenticated with check (
    (select auth.uid()) = user_id
    and (application_id is null or exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = (select auth.uid())))
  );
create policy "reminders_update_own" on public.reminders
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check (
    (select auth.uid()) = user_id
    and (application_id is null or exists (
      select 1 from public.applications a
      where a.id = application_id and a.user_id = (select auth.uid())))
  );
create policy "reminders_delete_own" on public.reminders
  for delete to authenticated using ((select auth.uid()) = user_id);
