-- Migrazione per aggiungere la colonna is_active alla tabella price_lists

ALTER TABLE price_lists ADD COLUMN is_active BOOLEAN DEFAULT true;
