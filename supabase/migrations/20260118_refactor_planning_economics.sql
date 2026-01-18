-- 1. Add Price List to Pianificazioni (Supplier Price List)
ALTER TABLE pianificazioni 
ADD COLUMN price_list_id uuid REFERENCES price_lists(id);

-- 2. Link work_order_items to Pianificazioni (for Consuntivi)
ALTER TABLE work_order_items
ADD COLUMN pianificazione_id uuid REFERENCES pianificazioni(id) ON DELETE CASCADE;

-- 3. Update RLS (if needed) - existing ones should cover authenticated users
