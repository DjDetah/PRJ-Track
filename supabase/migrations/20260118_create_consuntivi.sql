-- Create consuntivi table (Effettivo) linked to pianificazioni
create table if not exists public.consuntivi (
  id uuid not null default gen_random_uuid() primary key,
  pianificazione_id uuid not null references public.pianificazioni(id) on delete cascade,
  codice_attivita text not null,
  quantita integer not null default 1,
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.consuntivi enable row level security;

-- Policies
create policy "Authenticated users can view consuntivi" on public.consuntivi
  for select to authenticated using (true);

create policy "Staff can insert consuntivi" on public.consuntivi
  for insert to authenticated with check (
    public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );

create policy "Staff can update consuntivi" on public.consuntivi
  for update to authenticated using (
    public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );

create policy "Staff can delete consuntivi" on public.consuntivi
  for delete to authenticated using (
     public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );
