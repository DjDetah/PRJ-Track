-- Create Economics Table (Consuntivi & Preventivi unified)
create table work_order_items (
    id uuid default gen_random_uuid() primary key,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    
    work_order_id text not null references work_orders(work_order) on delete cascade,
    price_list_item_id uuid references listini(id) on delete set null, -- Optional link to source item
    
    type text not null check (type in ('preventivo', 'consuntivo')),
    
    -- Snapshot data (in case price list changes, we keep history)
    codice_attivita text not null,
    descrizione text,
    quantity numeric not null default 1,
    unit_price numeric not null default 0,
    total_price numeric generated always as (quantity * unit_price) stored,
    
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Index for fast retrieval
create index idx_work_order_items_wo_type on work_order_items(work_order_id, type);

-- Enable RLS
alter table work_order_items enable row level security;

create policy "Enable read access for all users" on work_order_items for select using (true);
create policy "Enable insert for authenticated users only" on work_order_items for insert with check (auth.role() = 'authenticated');
create policy "Enable update for authenticated users only" on work_order_items for update using (auth.role() = 'authenticated');
create policy "Enable delete for authenticated users only" on work_order_items for delete using (auth.role() = 'authenticated');

-- Comments
comment on column work_order_items.price_list_item_id is 'Link to the original listino item if applicable';
comment on column work_order_items.unit_price is 'Snapshot of price at time of insertion';
