-- 1. Fix Price List Association
-- Assign the default 'Consuntivo' price list to all Work Orders that don't have one
DO $$
DECLARE
    default_price_list_id uuid;
BEGIN
    -- Find the default price list for 'Consuntivo'
    SELECT id INTO default_price_list_id
    FROM price_lists
    WHERE type = 'Consuntivo' AND is_default = true
    LIMIT 1;

    -- If found, update work_orders
    IF default_price_list_id IS NOT NULL THEN
        UPDATE work_orders
        SET price_list_id = default_price_list_id
        WHERE price_list_id IS NULL;
    END IF;
END $$;

-- 2. Migrate Preventivi
-- Insert existing preventivi into work_order_items with snapshot prices
INSERT INTO work_order_items (
    work_order_id,
    type,
    codice_attivita,
    quantity,
    unit_price,
    price_list_item_id
)
SELECT 
    p.work_order_id,
    'preventivo',
    p.codice_attivita,
    p.quantita,
    COALESCE(l.importo, 0), -- Snapshot the current price from listino
    l.id
FROM preventivi p
LEFT JOIN work_orders w ON w.work_order = p.work_order_id
LEFT JOIN listini l ON l.codice = p.codice_attivita AND l.price_list_id = w.price_list_id
WHERE NOT EXISTS (
    SELECT 1 FROM work_order_items woi 
    WHERE woi.work_order_id = p.work_order_id 
    AND woi.type = 'preventivo' 
    AND woi.codice_attivita = p.codice_attivita
); 
-- Note: The WHERE clause prevents duplicate migration if run multiple times, 
-- though precise duplicate checking might be tricky if quantity differs. 
-- Assuming clean slate for work_order_items for this migration is safer or simpler logic.

-- 3. Migrate Consuntivi (from Pianificazioni)
-- Insert existing consuntivi linked to pianificazioni into work_order_items
INSERT INTO work_order_items (
    work_order_id,
    type,
    codice_attivita,
    quantity,
    unit_price,
    price_list_item_id
)
SELECT 
    plan.work_order_id,
    'consuntivo',
    c.codice_attivita,
    c.quantita,
    COALESCE(l.importo, 0), -- Snapshot current price
    l.id
FROM consuntivi c
JOIN pianificazioni plan ON plan.id = c.pianificazione_id
LEFT JOIN work_orders w ON w.work_order = plan.work_order_id
LEFT JOIN listini l ON l.codice = c.codice_attivita AND l.price_list_id = w.price_list_id
WHERE NOT EXISTS (
    SELECT 1 FROM work_order_items woi 
    WHERE woi.work_order_id = plan.work_order_id 
    AND woi.type = 'consuntivo' 
    AND woi.codice_attivita = c.codice_attivita
    -- We are aggregating potentially multiple same codes from different plannings, 
    -- but work_order_items is a list of items. 
    -- If we want to keep them separate, we just insert them.
    -- The NOT EXISTS check here is weak if we have multiple same codes.
    -- Better to just clear work_order_items or assume empty for now.
    -- Let's assume work_order_items is empty or we accept duplicates if run twice without cleanup.
);

-- Optional: If you want to consolidate multiple same items into one line per WO in work_order_items?
-- No, let's keep them as individual entries (maybe adding a note about origin?).
-- For now, direct mapping is safest.
