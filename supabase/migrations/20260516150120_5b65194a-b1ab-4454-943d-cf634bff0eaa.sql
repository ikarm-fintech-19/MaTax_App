
-- Profiles
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  company_name text,
  nif text,
  rc text,
  address text,
  locale text not null default 'fr' check (locale in ('fr','ar','en')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.profiles enable row level security;
create policy "profiles self select" on public.profiles for select using (auth.uid() = id);
create policy "profiles self insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles self update" on public.profiles for update using (auth.uid() = id);

-- Declarations
create type public.declaration_type as enum ('g50','irg','ibs','tfpc','withholding','dividend');
create type public.declaration_status as enum ('draft','submitted');

create table public.declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type public.declaration_type not null,
  status public.declaration_status not null default 'draft',
  period_label text,
  fiscal_year int,
  input jsonb not null default '{}'::jsonb,
  result jsonb not null default '{}'::jsonb,
  total_due numeric(18,2),
  submitted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.declarations enable row level security;
create index on public.declarations (user_id, type, created_at desc);
create policy "decl self select" on public.declarations for select using (auth.uid() = user_id);
create policy "decl self insert" on public.declarations for insert with check (auth.uid() = user_id);
create policy "decl self update" on public.declarations for update using (auth.uid() = user_id);
create policy "decl self delete" on public.declarations for delete using (auth.uid() = user_id);

-- Audit log (insert-only)
create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  action text not null,
  declaration_id uuid references public.declarations(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.audit_log enable row level security;
create index on public.audit_log (user_id, created_at desc);
create policy "audit self select" on public.audit_log for select using (auth.uid() = user_id);
create policy "audit self insert" on public.audit_log for insert with check (auth.uid() = user_id);

-- updated_at trigger
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create trigger profiles_updated before update on public.profiles
  for each row execute function public.tg_set_updated_at();
create trigger declarations_updated before update on public.declarations
  for each row execute function public.tg_set_updated_at();

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
