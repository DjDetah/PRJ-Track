-- 1. Create the new Header table
create table price_lists (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    type text not null check (type in ('Consuntivo', 'Fornitore')),
    is_default boolean default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    -- Ensure unique name per type to avoid confusion (optional but good practice)
    unique(name, type)
);

-- 2. Create Partial Unique Index for Defaults on the Header table (Correct Place)
create unique index unique_default_price_list_per_type 
on price_lists (type) 
where (is_default = true);

-- 3. Populate price_lists from existing listini data (deduplication)
insert into price_lists (name, type, created_at)
select distinct listino, tipo, min(created_at)
from listini
group by listino, tipo;

-- 4. Add FK column to existing listini table (Items)
alter table listini add column price_list_id uuid references price_lists(id) on delete cascade;

-- 5. Link Items to Headers
update listini l
set price_list_id = pl.id
from price_lists pl
where l.listino = pl.name and l.tipo = pl.type;

-- 6. Clean up listini table (Items)
-- Drop the now redundant columns and the problematic is_default
alter table listini 
    drop column listino,
    drop column tipo,
    drop column is_default;

-- Make price_list_id mandatory
alter table listini alter column price_list_id set not null;

-- 7. Fix Work Orders Foreign Key
-- First drop the old column/constraint if it exists (it was linking to an arbitrary item ID, which is wrong)
alter table work_orders drop column if exists listino_client_id;

-- Add the correct column linking to the Header
alter table work_orders add column price_list_id uuid references price_lists(id);

-- Enable RLS on new table
alter table price_lists enable row level security;
create policy "Enable read access for all users" on price_lists for select using (true);
create policy "Enable insert for authenticated users only" on price_lists for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on price_lists for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on price_lists for delete using (auth.role() = 'authenticated');
