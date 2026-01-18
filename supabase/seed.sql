-- Pre-requisite: Create users in Auth manually or via script.

INSERT INTO public.work_orders (
  work_order, numero, progetto, stato, citta, descrizione, avvio_programmato
) VALUES
('WO-2024-001', '001', 'Rollout PC Lombardia', 'In Progress', 'Milano', 'Sostituzione parco macchine', '2024-02-01 09:00:00+01'),
('WO-2024-002', '002', 'Cablaggio Roma', 'New', 'Roma', 'Upgrade Rete Cat6', '2024-03-10 09:00:00+01'),
('WO-2024-003', '003', 'Server Migration', 'Done', 'Napoli', 'Migrazione VMWare', '2024-01-15 09:00:00+01');
