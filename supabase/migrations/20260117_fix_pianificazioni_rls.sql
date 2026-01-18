-- Migration: Add missing UPDATE policy for pianificazioni table
-- Without this policy, updates return 0 rows under RLS.

create policy "Staff can update pianificazioni" on public.pianificazioni
  for update to authenticated using (
    public.get_current_user_role() in ('admin', 'supervisor', 'project_manager', 'operator')
  );
