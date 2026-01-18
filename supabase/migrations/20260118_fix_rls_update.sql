-- ABILITA POLICY DI AGGIORNAMENTO PER WORK_ORDERS
-- Esegui questo script nell'SQL Editor di Supabase

-- 1. Assicurati che RLS sia attivo (giusto per sicurezza)
alter table "public"."work_orders" enable row level security;

-- 2. Crea una policy per permettere l'aggiornamento agli utenti autenticati
create policy "Policy Modifica Work Order"
on "public"."work_orders"
for update
to authenticated
using (true)
with check (true);
