-- Fix 1: Add explicit deny policies for user_roles table modifications
-- Only the trigger can insert roles (during user creation)
CREATE POLICY "System only can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (false);

-- Prevent all direct updates to roles
CREATE POLICY "No direct role updates"
  ON public.user_roles FOR UPDATE
  USING (false);

-- Prevent all direct deletes (roles cascade delete with user)
CREATE POLICY "No direct role deletes"
  ON public.user_roles FOR DELETE
  USING (false);

-- Fix 2: Secure has_role() function - only allow checking own role or if caller is admin
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Allow checking if the user_id matches the caller OR caller is admin
    WHEN _user_id = auth.uid() OR EXISTS(
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
    ELSE false
  END
$$;

-- Fix 3: Secure get_user_role() function - only allow checking own role or if caller is admin
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    -- Allow checking if the user_id matches the caller OR caller is admin
    WHEN _user_id = auth.uid() OR EXISTS(
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    ) THEN (
      SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
    )
    ELSE NULL
  END
$$;