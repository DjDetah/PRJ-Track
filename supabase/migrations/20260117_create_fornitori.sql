-- Enable moddatetime extension
create extension if not exists moddatetime schema extensions;

-- Create Fornitori Table
create table public.fornitori (
  id uuid not null default gen_random_uuid(),
  ragione_sociale text not null,
  p_iva text,
  codice_fiscale text,
  indirizzo text,
  citta text,
  cap text,
  provincia text,
  email text,
  telefono text,
  note text,
  stato text default 'Attivo'::text check (stato in ('Attivo', 'Inattivo', 'Sospeso')),
  
  -- Metadata
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  
  -- Constraints
  constraint fornitori_pkey primary key (id),
  constraint fornitori_p_iva_key unique (p_iva)
);

-- Enable RLS
alter table public.fornitori enable row level security;

-- Policies (consistent with work_orders for now: authenticated access)
create policy "Enable read access for authenticated users"
on public.fornitori for select
to authenticated
using (true);

create policy "Enable insert access for authenticated users"
on public.fornitori for insert
to authenticated
with check (true);

create policy "Enable update access for authenticated users"
on public.fornitori for update
to authenticated
using (true)
with check (true);

create policy "Enable delete access for authenticated users"
on public.fornitori for delete
to authenticated
using (true);

-- Trigger for updated_at
create trigger handle_updated_at before update on public.fornitori
for each row execute procedure moddatetime (updated_at);

-- Link Pianificazioni to Fornitori
alter table public.pianificazioni 
add column if not exists fornitore_id uuid references public.fornitori(id) on delete set null;
