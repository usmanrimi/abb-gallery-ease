-- Create enum for app roles if it doesn't exist
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('admin', 'customer', 'super_admin', 'admin_ops');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add role column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role public.app_role DEFAULT 'customer'::public.app_role;

-- Migrate existing roles from user_roles table to profiles table
-- This assumes user_roles has (user_id, role) columns
UPDATE public.profiles
SET role = user_roles.role::text::public.app_role
FROM public.user_roles
WHERE public.profiles.id = user_roles.user_id;

-- Create a policy to allow users to read their own role
CREATE POLICY "Users can read own role" ON public.profiles
    FOR SELECT
    USING (auth.uid() = id);

-- Create a policy to allow admins and super_admins to read all profiles
CREATE POLICY "Admins can read all profiles" ON public.profiles
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles AS p
        WHERE p.id = auth.uid()
        AND (p.role = 'admin_ops' OR p.role = 'super_admin')
      )
    );

-- Create a policy to allow super_admins to update roles
CREATE POLICY "Super Admins can update roles" ON public.profiles
    FOR UPDATE
    USING (
      EXISTS (
        SELECT 1 FROM public.profiles AS p
        WHERE p.id = auth.uid()
        AND p.role = 'super_admin'
      )
    );

-- Drop user_roles table effectively deprecating it
-- DROP TABLE IF EXISTS public.user_roles;
