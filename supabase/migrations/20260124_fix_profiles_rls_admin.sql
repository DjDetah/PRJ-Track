-- Allow Admins to update all profiles
-- Drop existing policies if any restrict this (usually it's "Users can update own profile")

-- Ensure we have a policy for Admins
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;

CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING ( 
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);

-- Also ensure Admins can insert if needed (though usually done via trigger on auth.users)
-- But for manual profile creation (if we support it later):
DROP POLICY IF EXISTS "Admins can insert profiles" ON public.profiles;

CREATE POLICY "Admins can insert profiles"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.profiles WHERE role = 'admin'
  )
);
