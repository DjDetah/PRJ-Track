-- Make data_pianificazione nullable
ALTER TABLE "public"."pianificazioni" ALTER COLUMN "data_pianificazione" DROP NOT NULL;

-- Add Check Constraint: Either Date OR Supplier must be present
ALTER TABLE "public"."pianificazioni" 
ADD CONSTRAINT "check_date_or_supplier" 
CHECK (
  "data_pianificazione" IS NOT NULL OR 
  "fornitore_id" IS NOT NULL
);
