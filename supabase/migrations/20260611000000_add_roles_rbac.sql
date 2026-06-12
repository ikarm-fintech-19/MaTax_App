-- ============================================================
-- MATAX RBAC: Roles, Expert-Client relationships, Admin access
-- ============================================================

-- 1. Create role enum
create type public.user_role as enum ('user', 'expert', 'admin');

-- 2. Add role column to profiles (default: 'user')
alter table public.profiles add column role public.user_role not null default 'user';

-- 3. Add expert_id to profiles (links a user to their assigned expert, nullable)
alter table public.profiles add column expert_id uuid references public.profiles(id) on delete set null;

-- 4. Create expert_clients junction table (for expert -> client management)
create table public.expert_clients (
  id uuid primary key default gen_random_uuid(),
  expert_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(expert_id, client_id)
);
alter table public.expert_clients enable row level security;

-- RLS: experts see their own clients
create policy "expert see own clients" on public.expert_clients
  for select using (auth.uid() = expert_id);

-- RLS: experts can add/remove clients
create policy "expert manage clients" on public.expert_clients
  for all using (auth.uid() = expert_id);

-- RLS: users can see which expert they're assigned to
create policy "user see own expert assignment" on public.expert_clients
  for select using (auth.uid() = client_id);

-- RLS: admins can see and manage all expert-client relationships
create policy "admin all expert_clients" on public.expert_clients
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. Update profiles RLS: admins can read all profiles
create policy "admin read all profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 6. Update profiles RLS: experts can read their clients' profiles
create policy "expert read client profiles" on public.profiles
  for select using (
    exists (
      select 1 from public.expert_clients
      where expert_id = auth.uid() and client_id = public.profiles.id
    )
  );

-- 7. Update declarations RLS: experts can read their clients' declarations
create policy "expert read client declarations" on public.declarations
  for select using (
    exists (
      select 1 from public.expert_clients ec
      join public.profiles p on p.id = ec.client_id
      where ec.expert_id = auth.uid()
        and ec.client_id = public.declarations.user_id
    )
  );

-- 8. Update declarations RLS: admins can read all declarations
create policy "admin all declarations" on public.declarations
  for all using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 9. Add index for role lookups
create index on public.profiles (role);
create index on public.profiles (expert_id);
create index on public.expert_clients (expert_id);
create index on public.expert_clients (client_id);

-- 10. Update handle_new_user to also set role from metadata
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'role')::public.user_role, 'user')
  )
  on conflict (id) do nothing;
  return new;
end $$;
