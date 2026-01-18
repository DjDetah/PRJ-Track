create table listini (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  listino text not null,
  tipo text not null check (tipo in ('Consuntivo', 'Fornitore')),
  codice text not null,
  descrizione text not null,
  descrizione_attivita text,
  importo numeric not null default 0
);

-- RLS
alter table listini enable row level security;

create policy "Enable read access for all users"
on listini for select
using (true);

create policy "Enable insert access for authenticated users only"
on listini for insert
with check (auth.role() = 'authenticated');

create policy "Enable update access for authenticated users only"
on listini for update
using (auth.role() = 'authenticated');

create policy "Enable delete access for authenticated users only"
on listini for delete
using (auth.role() = 'authenticated');
