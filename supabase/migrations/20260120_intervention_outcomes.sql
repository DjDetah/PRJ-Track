-- 1. Update esito column to accept 'IN CORSO'
ALTER TABLE "public"."pianificazioni" 
DROP CONSTRAINT IF EXISTS "pianificazioni_esito_check";

ALTER TABLE "public"."pianificazioni"
ADD CONSTRAINT "pianificazioni_esito_check"
CHECK (esito IN ('IN CORSO', 'OK', 'NON OK'));

-- 2. Add motivazione_fallimento column
ALTER TABLE "public"."pianificazioni"
ADD COLUMN IF NOT EXISTS "motivazione_fallimento" text;

-- 3. Add LOGIC check constraint (Motivazione required IF NON OK, forbidden otherwise)
-- Note: We removed the hardcoded list check in favor of the lookup table approach
ALTER TABLE "public"."pianificazioni"
ADD CONSTRAINT "pianificazioni_motivazione_logic_check"
CHECK (
  (esito != 'NON OK' AND motivazione_fallimento IS NULL) OR
  (esito = 'NON OK' AND motivazione_fallimento IS NOT NULL)
);

-- 4. Create Lookup Table for Dynamic Failure Reasons
CREATE TABLE IF NOT EXISTS "public"."planning_failure_reasons" (
    "id" uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    "reason" text NOT NULL UNIQUE,
    "is_active" boolean DEFAULT true,
    "created_at" timestamptz DEFAULT now()
);

-- 5. Enable RLS on new table
ALTER TABLE "public"."planning_failure_reasons" ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Everyone can read
CREATE POLICY "Authenticated can view reasons" 
ON "public"."planning_failure_reasons" 
FOR SELECT TO authenticated 
USING (true);

-- Only Managers/Admins can edit
CREATE POLICY "Managers can manage reasons" 
ON "public"."planning_failure_reasons" 
FOR ALL TO authenticated 
USING (public.get_current_user_role() IN ('admin', 'supervisor', 'project_manager'))
WITH CHECK (public.get_current_user_role() IN ('admin', 'supervisor', 'project_manager'));

-- 7. Seed Initial Data
INSERT INTO "public"."planning_failure_reasons" ("reason") VALUES
('MANCATO INTERVENTO'),
('CAUSE ESTERNE'),
('ATTESA INFO CLIENTE'),
('UTENTE NON DISPONIBILE'),
('UTENTE ASSENTE'),
('MATERIALE NON CONSEGNATO'),
('INTERVENTO NON CONCLUSO')
ON CONFLICT ("reason") DO NOTHING;
