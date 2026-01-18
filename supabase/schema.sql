-- Enable RLS on public tables (auth.users is managed by Supabase)

-- NOTE: Dropping tables to ensure clean slate as requested
drop table if exists public.work_orders;
drop table if exists public.profiles;

-- PROFILES TABLE (Public User Data)
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  email text not null,
  role text not null check (role in ('admin', 'supervisor', 'project_manager', 'operator')),
  full_name text,
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

-- WORK ORDERS (Fact Table)
-- Mapped strictly to user requirements
create table public.work_orders (
  -- PK: Elemento principale (WorkOrder)
  work_order text not null primary key, 
  
  -- Numero (Task ID)
  numero text,
  
  -- Progetto
  progetto text,
  
  -- SOA Code (Punto Operativo)
  soa_code text,
  
  -- Breve descrizione
  breve_descrizione text,
  
  -- Descrizione
  descrizione text,
  
  -- Stato
  stato text not null default 'New',
  
  -- Date fields: Mapped to TIMESTAMPTZ to ensure absolute point in time handling.
  -- Even if imported from Excel, converting to UTC is best practice for Enterprise apps.
  avvio_programmato timestamptz,
  fine_prevista timestamptz,
  aggiornato timestamptz,
  chiuso timestamptz,
  
  -- Location
  regione text,
  citta text,
  provincia text,
  cap text,
  via text, -- "Via"
  
  -- Contact
  telefono text,
  
  -- Flags
  sede_presidiata boolean, -- SI/NULL -> True/Null
  
  -- System Fields (Audit)
  system_created_at timestamptz default now(),
  system_updated_at timestamptz default now(),
  created_by uuid references auth.users(id)
);

alter table public.work_orders enable row level security;

-- RLS POLICIES --

-- Helper function to get current user role
create or replace function public.get_current_user_role()
returns text
language sql
security definer
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Profiles:
-- Users can view their own profile
create policy "Users can view own profile" on public.profiles
  for select using (auth.uid() = id);

-- Admins/Supervisors can view all profiles
create policy "Admins can view all profiles" on public.profiles
  for select using (
    public.get_current_user_role() in ('admin', 'supervisor')
  );

-- WorkOrders:
-- Read: Everyone (authenticated) can view
create policy "Authenticated users can view work orders" on public.work_orders
  for select to authenticated using (true);

-- Write: Admin, Supervisor, PM, Operator can insert/update (Expanded for MVP)
create policy "Staff can insert work orders" on public.work_orders
  for insert to authenticated with check (
    public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );

create policy "Staff can update work orders" on public.work_orders
  for update to authenticated using (
    public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );

create policy "Admins/Supervisors can delete work orders" on public.work_orders
  for delete to authenticated using (
    public.get_current_user_role() in ('admin', 'supervisor')
  );

-- TRIGGERS --
-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, role, full_name)
  values (new.id, new.email, 'operator', new.raw_user_meta_data->>'full_name');
  return new;
end;
$$;

-- Drop trigger if exists to avoid errors on re-run
drop trigger if exists on_auth_user_created on auth.users;
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- PIANIFICAZIONI (Technical Schedule)
create table if not exists public.pianificazioni (
  id uuid not null default gen_random_uuid() primary key,
  work_order_id text not null references public.work_orders(work_order) on delete cascade,
  data_pianificazione timestamptz not null,
  created_at timestamptz default now()
);

alter table public.pianificazioni enable row level security;

create policy "Authenticated users can view pianificazioni" on public.pianificazioni
  for select to authenticated using (true);

create policy "Staff can insert pianificazioni" on public.pianificazioni
  for insert to authenticated with check (
    public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );

create policy "Staff can delete pianificazioni" on public.pianificazioni
  for delete to authenticated using (
     public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );
