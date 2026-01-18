-- Add is_default column to listini
alter table listini add column is_default boolean default false;

-- Add Partial Unique Index to ensure only one default per type
create unique index unique_default_listino_per_type 
on listini (tipo) 
where (is_default = true);

-- Add listino_client_id to work_orders
alter table work_orders add column listino_client_id uuid references listini(id);

-- Simple policy update (already covered by "Enable read access for all users" but ensuring specificity if needed later)
-- existing policies on work_orders and listini should cover new columns automatically.
