-- 1. Add 'gestione' column to work_orders
ALTER TABLE "public"."work_orders"
ADD COLUMN IF NOT EXISTS "gestione" text DEFAULT 'Da Assegnare';

-- 2. Create the calculation function (Accepts TEXT - NO CASTING TO UUID)
CREATE OR REPLACE FUNCTION public.calculate_gestione_status(input_wo_id text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    planning_count integer;
    has_in_corso boolean;
    last_planning record;
    wo_status text; -- New variable
BEGIN
    -- NO CASTING NEEDED. IDs are TEXT (e.g., 'WO0639375')

    -- 0. CHECK PARENT STATUS FIRST
    -- If the Work Order is already Closed/Completed, force 'Completato'
    SELECT stato INTO wo_status FROM public.work_orders WHERE work_order = input_wo_id;
    
    -- Check common "Closed" strings (case insensitive)
    IF wo_status ILIKE '%chiuso%' OR wo_status ILIKE '%eseguito%' OR wo_status ILIKE '%terminato%' OR wo_status ILIKE '%close%' OR wo_status ILIKE '%completato%' THEN
        RETURN 'Completato';
    END IF;

    -- 1. Count total plannings
    SELECT COUNT(*) INTO planning_count
    FROM public.pianificazioni
    WHERE work_order_id = input_wo_id; -- Auto-cast if column is uuid, or direct match if text

    -- CASE 0: No plannings exists
    IF planning_count = 0 THEN
        RETURN 'Da Assegnare';
    END IF;

    -- 2. Check for 'IN CORSO' (Priority: If any is running, the whole WO is running)
    SELECT EXISTS (
        SELECT 1 FROM public.pianificazioni
        WHERE work_order_id = input_wo_id
        AND esito = 'IN CORSO'
    ) INTO has_in_corso;

    IF has_in_corso THEN
        RETURN 'In Corso';
    END IF;

    -- 3. Analyze the LAST planning (Ordered by Date DESC, then Created DESC)
    SELECT * INTO last_planning
    FROM public.pianificazioni
    WHERE work_order_id = input_wo_id
    ORDER BY data_pianificazione DESC NULLS LAST, created_at DESC
    LIMIT 1;

    -- CASE: Last planning is OK -> Completato
    IF last_planning.esito = 'OK' THEN
        RETURN 'Completato';
    END IF;

    -- CASE: Last planning is NON OK -> Da Ripianificare
    IF last_planning.esito = 'NON OK' THEN
        RETURN 'Da Ripianificare';
    END IF;

    -- CASE: Last planning has a Date (and is not OK/NON OK/IN CORSO checked above) -> Pianificato
    IF last_planning.data_pianificazione IS NOT NULL THEN
        -- Additional check: Is it in the future or past? 
        -- User definition: "Pianificato: la prima pianificazione futura valida".
        -- However, here we are looking at the *last* one.
        -- If the last one has a date and no outcome, it is 'Pianificato'.
        RETURN 'Pianificato';
    END IF;

    -- CASE: Last planning has NO Date but Has Supplier -> Da Pianificare
    IF last_planning.data_pianificazione IS NULL AND last_planning.fornitore_id IS NOT NULL THEN
        RETURN 'Da Pianificare';
    END IF;

    -- Fallback
    RETURN 'Da Assegnare';
END;
$$;

-- 3. Create Trigger Function
CREATE OR REPLACE FUNCTION public.trigger_update_gestione()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    target_wo_id text; -- CHANGED TO TEXT
BEGIN
    IF (TG_OP = 'DELETE') THEN
        target_wo_id := OLD.work_order_id; -- Explicitly expecting text or castable to text
    ELSE
        target_wo_id := NEW.work_order_id;
    END IF;

    UPDATE public.work_orders
    SET gestione = public.calculate_gestione_status(target_wo_id)
    WHERE work_order = target_wo_id;

    RETURN NULL;
END;
$$;

-- 4. Create Trigger
DROP TRIGGER IF EXISTS update_gestione_trigger ON public.pianificazioni;

CREATE TRIGGER update_gestione_trigger
AFTER INSERT OR UPDATE OR DELETE
ON public.pianificazioni
FOR EACH ROW
EXECUTE FUNCTION public.trigger_update_gestione();

-- 5. Backfill existing data
DO $$
DECLARE
    r record;
BEGIN
    FOR r IN SELECT work_order FROM public.work_orders LOOP
        UPDATE public.work_orders
        SET gestione = public.calculate_gestione_status(r.work_order)
        WHERE work_order = r.work_order;
    END LOOP;
END;
$$;
