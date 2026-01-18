-- Create preventivi table to store estimate lines linked to work orders
create table if not exists public.preventivi (
  id uuid not null default gen_random_uuid() primary key,
  work_order_id text not null references public.work_orders(work_order) on delete cascade,
  codice_attivita text not null,
  quantita integer not null default 1,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.preventivi enable row level security;

-- Policies (Same as other related tables)
create policy "Authenticated users can view preventivi" on public.preventivi
  for select to authenticated using (true);

create policy "Staff can insert preventivi" on public.preventivi
  for insert to authenticated with check (
    public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );

create policy "Staff can update preventivi" on public.preventivi
  for update to authenticated using (
    public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );

create policy "Staff can delete preventivi" on public.preventivi
  for delete to authenticated using (
     public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );
