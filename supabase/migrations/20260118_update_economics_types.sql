-- Drop existing constraint
ALTER TABLE work_order_items DROP CONSTRAINT IF EXISTS work_order_items_type_check;

-- Add new constraint with 'consuntivo_cliente'
ALTER TABLE work_order_items 
ADD CONSTRAINT work_order_items_type_check 
CHECK (type IN ('preventivo', 'consuntivo', 'consuntivo_cliente'));
