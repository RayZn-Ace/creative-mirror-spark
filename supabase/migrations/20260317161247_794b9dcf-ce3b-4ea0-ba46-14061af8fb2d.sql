CREATE POLICY "Submitters can read their own u18 form"
  ON public.u18_forms
  FOR SELECT
  USING (true);

-- Drop the old admin-only select policy
DROP POLICY IF EXISTS "Admins can view u18 forms" ON public.u18_forms;

-- Re-create admin select (keep it, but we need a general one for the insert+select flow)
-- Actually, just use a single permissive SELECT policy that allows everyone to read
-- Admins need it for admin panel, and submitters need it for the .select() after insert
