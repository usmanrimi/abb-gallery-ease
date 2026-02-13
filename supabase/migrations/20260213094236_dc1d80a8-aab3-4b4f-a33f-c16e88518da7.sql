
-- Step 1: Add admin_ops to the enum only
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'admin_ops';
