-- ============================================================
-- M. ABBA GALLERY – COMPLETE DATABASE MIGRATION
-- Run this ENTIRE script in Supabase SQL Editor
-- It is safe to re-run (uses IF NOT EXISTS / IF EXISTS)
-- ============================================================

-- ============================================================
-- 0. HELPER FUNCTION (avoids RLS recursion on profiles)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role::text FROM public.profiles WHERE id = auth.uid();
$$;

-- ============================================================
-- 1. ENUM TYPE
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('customer', 'admin_ops', 'super_admin');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ============================================================
-- 2. TABLES
-- ============================================================

-- 2a. profiles (should already exist)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  role TEXT DEFAULT 'customer',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2b. packages
CREATE TABLE IF NOT EXISTS public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  image_url TEXT,
  class_image_url TEXT,
  has_classes BOOLEAN DEFAULT false,
  base_price NUMERIC,
  starting_price NUMERIC,
  is_hidden BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;

-- 2c. package_classes
CREATE TABLE IF NOT EXISTS public.package_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  description TEXT DEFAULT '',
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.package_classes ENABLE ROW LEVEL SECURITY;

-- 2d. orders
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_order_id TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  package_name TEXT NOT NULL,
  package_class TEXT,
  quantity INT DEFAULT 1,
  notes TEXT,
  custom_request TEXT,
  total_price NUMERIC DEFAULT 0,
  final_price NUMERIC DEFAULT 0,
  admin_set_price NUMERIC,
  discount_amount NUMERIC DEFAULT 0,
  payment_method TEXT,
  payment_status TEXT DEFAULT 'pending',
  payment_proof_url TEXT,
  payment_proof_type TEXT,
  payment_reference TEXT,
  payment_verified_at TIMESTAMPTZ,
  installment_plan TEXT,
  delivery_date TEXT,
  delivery_time TEXT,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  admin_response TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- 2e. notifications
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 2f. deliveries
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  custom_order_id TEXT,
  customer_name TEXT,
  customer_whatsapp TEXT,
  package_name TEXT,
  delivery_address TEXT,
  delivery_notes TEXT,
  delivery_date TEXT,
  delivery_time TEXT,
  status TEXT DEFAULT 'ready',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- 2g. category_settings
CREATE TABLE IF NOT EXISTS public.category_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL UNIQUE,
  is_coming_soon BOOLEAN DEFAULT false,
  custom_label TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.category_settings ENABLE ROW LEVEL SECURITY;

-- 2h. audit_log
CREATE TABLE IF NOT EXISTS public.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id UUID,
  details TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- 2i. order_messages (for OrderChat)
CREATE TABLE IF NOT EXISTS public.order_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- 2j. payment_proofs bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('package-images', 'package-images', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-proofs', 'payment-proofs', true)
ON CONFLICT (id) DO NOTHING;


-- ============================================================
-- 3. DROP ALL EXISTING POLICIES (clean slate)
-- ============================================================
DO $$ 
DECLARE
  _tbl TEXT;
  _pol RECORD;
BEGIN
  FOR _tbl IN SELECT unnest(ARRAY[
    'profiles','packages','package_classes','orders',
    'notifications','deliveries','category_settings',
    'audit_log','order_messages'
  ])
  LOOP
    FOR _pol IN 
      SELECT policyname FROM pg_policies 
      WHERE schemaname = 'public' AND tablename = _tbl
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', _pol.policyname, _tbl);
    END LOOP;
  END LOOP;
END $$;

-- Also clean storage policies
DO $$
DECLARE _pol RECORD;
BEGIN
  FOR _pol IN 
    SELECT policyname FROM pg_policies 
    WHERE schemaname = 'storage' AND tablename = 'objects'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', _pol.policyname);
  END LOOP;
END $$;


-- ============================================================
-- 4. RLS POLICIES
-- ============================================================

-- ---------- PROFILES ----------
CREATE POLICY "Users read own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Admins read all profiles"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));

CREATE POLICY "Users insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Super admin update any profile"
  ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'super_admin');

CREATE POLICY "Super admin delete profiles"
  ON public.profiles FOR DELETE
  USING (public.get_my_role() = 'super_admin');


-- ---------- PACKAGES (public read, admin write) ----------
CREATE POLICY "Anyone can read packages"
  ON public.packages FOR SELECT
  USING (true);

CREATE POLICY "Admins manage packages"
  ON public.packages FOR ALL
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));


-- ---------- PACKAGE_CLASSES ----------
CREATE POLICY "Anyone can read classes"
  ON public.package_classes FOR SELECT
  USING (true);

CREATE POLICY "Admins manage classes"
  ON public.package_classes FOR ALL
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));


-- ---------- ORDERS ----------
CREATE POLICY "Customers read own orders"
  ON public.orders FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all orders"
  ON public.orders FOR SELECT
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));

CREATE POLICY "Authenticated users create orders"
  ON public.orders FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers update own orders"
  ON public.orders FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins update any order"
  ON public.orders FOR UPDATE
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));

CREATE POLICY "Admins delete orders"
  ON public.orders FOR DELETE
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));


-- ---------- NOTIFICATIONS ----------
CREATE POLICY "Users read own notifications"
  ON public.notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins read all notifications"
  ON public.notifications FOR SELECT
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));

CREATE POLICY "Admins create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin_ops', 'super_admin'));

CREATE POLICY "Users update own notifications"
  ON public.notifications FOR UPDATE
  USING (auth.uid() = user_id);


-- ---------- DELIVERIES ----------
CREATE POLICY "Admins manage deliveries"
  ON public.deliveries FOR ALL
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));

CREATE POLICY "Customers read own deliveries"
  ON public.deliveries FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );


-- ---------- CATEGORY_SETTINGS ----------
CREATE POLICY "Anyone can read category settings"
  ON public.category_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins manage category settings"
  ON public.category_settings FOR ALL
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));


-- ---------- AUDIT_LOG ----------
CREATE POLICY "Super admins manage audit log"
  ON public.audit_log FOR ALL
  USING (public.get_my_role() = 'super_admin');

CREATE POLICY "Admins read audit log"
  ON public.audit_log FOR SELECT
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));

CREATE POLICY "Admins insert audit log"
  ON public.audit_log FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin_ops', 'super_admin'));


-- ---------- ORDER_MESSAGES ----------
CREATE POLICY "Users read own order messages"
  ON public.order_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins read all order messages"
  ON public.order_messages FOR SELECT
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));

CREATE POLICY "Users insert own order messages"
  ON public.order_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders o
      WHERE o.id = order_id AND o.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins insert order messages"
  ON public.order_messages FOR INSERT
  WITH CHECK (public.get_my_role() IN ('admin_ops', 'super_admin'));


-- ---------- STORAGE ----------
CREATE POLICY "Public read package images"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('package-images', 'payment-proofs'));

CREATE POLICY "Auth users upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('package-images', 'payment-proofs') AND auth.role() = 'authenticated');

CREATE POLICY "Auth users update images"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('package-images', 'payment-proofs') AND auth.role() = 'authenticated');

CREATE POLICY "Auth users delete images"
  ON storage.objects FOR DELETE
  USING (bucket_id IN ('package-images', 'payment-proofs') AND auth.role() = 'authenticated');


-- ============================================================
-- 5. PROFILE TRIGGER (auto-create profile on signup)
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- DONE! All tables, RLS policies, and triggers are set up.
-- ============================================================
