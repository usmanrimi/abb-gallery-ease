-- ============================================================
-- M. ABBA GALLERY – FINAL OVERHAUL MIGRATION
-- Clean 3-layer system: super_admin, admin_ops, customer
-- ============================================================

-- 1. Ensure Role Enum and Profile Structure
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'app_role') THEN
    CREATE TYPE public.app_role AS ENUM ('customer', 'admin_ops', 'super_admin');
  END IF;
END $$;

ALTER TABLE public.profiles 
  ALTER COLUMN role SET DEFAULT 'customer';

-- Ensure profiles has required columns for 3-layer system
DO $$ BEGIN
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMPTZ;
END $$;

-- 2. Global Settings Table
CREATE TABLE IF NOT EXISTS public.global_settings (
    id TEXT PRIMARY KEY DEFAULT 'current',
    -- Branding
    logo_url TEXT,
    favicon_url TEXT,
    theme_color TEXT DEFAULT '#8B5CF6',
    footer_text TEXT DEFAULT '© 2024 M. Abba Gallery. All rights reserved.',
    -- Payment
    paystack_public_key TEXT,
    is_paystack_enabled BOOLEAN DEFAULT true,
    currency TEXT DEFAULT 'NGN',
    payment_mode TEXT DEFAULT 'direct', -- 'direct' or 'custom'
    -- Order Config
    order_id_prefix TEXT DEFAULT 'MAG/KN/26/',
    order_serial_padding INTEGER DEFAULT 5,
    -- Feature Toggles
    is_chat_enabled BOOLEAN DEFAULT true,
    is_checkout_enabled BOOLEAN DEFAULT true,
    is_signup_enabled BOOLEAN DEFAULT true,
    
    updated_at TIMESTAMPTZ DEFAULT now(),
    updated_by UUID REFERENCES auth.users(id)
);

-- Initialize settings if not exists
INSERT INTO public.global_settings (id) 
VALUES ('current') 
ON CONFLICT (id) DO NOTHING;

-- 3. Audit Log Enhancements (Ensuring columns exist)
DO $$ BEGIN
  ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS actor_email TEXT;
  ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS actor_role TEXT;
  ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS action_type TEXT; -- 'create', 'update', 'delete', 'login', 'toggle'
  ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS target_type TEXT; -- 'category', 'package', 'order', 'user', 'settings'
  ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS target_id TEXT;
  ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS ip_address TEXT;
  ALTER TABLE public.audit_log ADD COLUMN IF NOT EXISTS user_agent TEXT;
END $$;

-- 4. RLS Update (Strict 3-Layer)

-- Enable RLS on new tables
ALTER TABLE public.global_settings ENABLE ROW LEVEL SECURITY;

-- DROP ALL to avoid conflicts during overhaul
DO $$ 
DECLARE
  _tbl TEXT;
  _pol RECORD;
BEGIN
  FOR _tbl IN SELECT unnest(ARRAY['profiles','packages','package_classes','orders','notifications','deliveries','category_settings','audit_log','order_messages', 'global_settings'])
  LOOP
    FOR _pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = _tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _pol.policyname, _tbl);
    END LOOP;
  END LOOP;
END $$;

-- PROFILES
CREATE POLICY "Strict profiles read" ON public.profiles FOR SELECT USING (auth.uid() = id OR public.get_my_role() IN ('admin_ops', 'super_admin'));
CREATE POLICY "Super admin manage profiles" ON public.profiles FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- GLOBAL SETTINGS
CREATE POLICY "Public read global settings" ON public.global_settings FOR SELECT USING (true);
CREATE POLICY "Super admin manage global settings" ON public.global_settings FOR ALL USING (public.get_my_role() = 'super_admin');

-- CATEGORIES & PACKAGES
CREATE POLICY "Public read content" ON public.packages FOR SELECT USING (true);
CREATE POLICY "Public read content classes" ON public.package_classes FOR SELECT USING (true);
CREATE POLICY "Super admin manage content" ON public.packages FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "Super admin manage classes" ON public.package_classes FOR ALL USING (public.get_my_role() = 'super_admin');

-- ORDERS (Admin Ops handles daily, Super Admin observes)
CREATE POLICY "Customers own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Staff read all orders" ON public.orders FOR SELECT USING (public.get_my_role() IN ('admin_ops', 'super_admin'));
CREATE POLICY "Staff update orders" ON public.orders FOR UPDATE USING (public.get_my_role() IN ('admin_ops', 'super_admin'));
CREATE POLICY "Customers insert orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DELIVERIES (Linked to Order)
CREATE POLICY "Staff manage deliveries" ON public.deliveries FOR ALL USING (public.get_my_role() IN ('admin_ops', 'super_admin'));
CREATE POLICY "Customers own deliveries" ON public.deliveries FOR SELECT USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- CHAT (Global Chat per Customer)
CREATE POLICY "Staff chat access" ON public.order_messages FOR ALL USING (public.get_my_role() IN ('admin_ops', 'super_admin'));
CREATE POLICY "Customers own messages" ON public.order_messages FOR ALL USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

-- AUDIT LOG (Only Super Admin manages, Admin Ops reads)
CREATE POLICY "Super admin audit management" ON public.audit_log FOR ALL USING (public.get_my_role() = 'super_admin');
CREATE POLICY "Admin ops audit read" ON public.audit_log FOR SELECT USING (public.get_my_role() IN ('admin_ops', 'super_admin'));

-- 5. Helper Views / Functions
CREATE OR REPLACE VIEW public.admin_user_list AS
SELECT id, full_name, email, role, created_at, updated_at
FROM public.profiles
WHERE role IN ('admin_ops', 'super_admin');

-- Ensure get_my_role is robust
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- Dynamic Order ID Generation
CREATE OR REPLACE FUNCTION public.generate_custom_order_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_prefix TEXT;
  v_padding INTEGER;
  v_serial BIGINT;
BEGIN
  -- Get config
  SELECT order_id_prefix, order_serial_padding 
  INTO v_prefix, v_padding 
  FROM public.global_settings 
  WHERE id = 'current';

  -- Default fallbacks
  IF v_prefix IS NULL THEN v_prefix := 'MAG/KN/26/'; END IF;
  IF v_padding IS NULL THEN v_padding := 5; END IF;

  -- Get next serial from a sequence (ensure it exists)
  -- If you don't have a sequence, you can count rows or create one
  -- For now, let's assume a generic sequence 'order_serial_seq'
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'order_serial_seq') THEN
    CREATE SEQUENCE public.order_serial_seq;
  END IF;
  
  v_serial := nextval('public.order_serial_seq');
  
  RETURN v_prefix || LPAD(v_serial::text, v_padding, '0');
END;
$$;
