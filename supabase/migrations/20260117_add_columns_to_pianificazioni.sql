-- Add new columns to pianificazioni table
ALTER TABLE public.pianificazioni
ADD COLUMN note_importanti TEXT,
ADD COLUMN note_chiusura TEXT,
ADD COLUMN esito TEXT CHECK (esito IN ('OK', 'NON OK'));
