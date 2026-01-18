-- Create Pianificazioni Table
create table if not exists public.pianificazioni (
  id uuid not null default gen_random_uuid() primary key,
  work_order_id text not null references public.work_orders(work_order) on delete cascade,
  data_pianificazione timestamptz not null,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.pianificazioni enable row level security;

-- Policies (Same as WorkOrders for now)
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
