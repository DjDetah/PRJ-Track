-- Add Unique Constraint for UPSERT operations on Pianificazioni Import
ALTER TABLE public.pianificazioni 
ADD CONSTRAINT pianificazioni_wo_date_key UNIQUE (work_order_id, data_pianificazione);
