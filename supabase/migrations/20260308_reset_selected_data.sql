-- Migration: Create reset_selected_data RPC
-- Description: Allows admins to dynamically truncate selected transactional tables safely.

CREATE OR REPLACE FUNCTION public.reset_selected_data(tables_to_truncate text[])
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Required to bypass RLS for TRUNCATE
AS $$
DECLARE
    allowed_tables text[] := ARRAY['work_orders', 'work_order_items', 'pianificazioni', 'preventivi', 'consuntivi', 'listini', 'price_lists', 'fornitori'];
    table_name text;
    valid_tables text[] := ARRAY[]::text[];
BEGIN
    -- 1. Check if the user executing this function is an admin
    -- Assuming we can check the profiles table based on auth.uid()
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Access denied: Only administrators can reset data.';
    END IF;

    -- 2. Validate input tables against the allowed list to prevent SQL injection
    FOREACH table_name IN ARRAY tables_to_truncate
    LOOP
        IF table_name = ANY(allowed_tables) THEN
            valid_tables := array_append(valid_tables, table_name);
        ELSE
            RAISE EXCEPTION 'Invalid table requested for reset: %', table_name;
        END IF;
    END LOOP;

    -- 3. Execute TRUNCATE if valid tables are provided
    IF array_length(valid_tables, 1) > 0 THEN
        -- Construct the dynamic TRUNCATE CASCADE command
        -- CASCADE is used because we might truncate parent tables like work_orders before child tables,
        -- or we want to ensure all foreign key constraints are respected by deleting orphans.
        EXECUTE 'TRUNCATE TABLE ' || array_to_string(valid_tables, ', ') || ' CASCADE;';
    END IF;
END;
$$;
