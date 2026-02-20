-- Super Admin Enhancement & Category Migration

-- 1. Create categories table
CREATE TABLE IF NOT EXISTS public.categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  slug TEXT NOT NULL UNIQUE,
  is_coming_soon BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Migrate existing categories
INSERT INTO public.categories (id, name, description, slug, is_coming_soon)
VALUES 
('1', 'Kayan Sallah', 'Premium Eid celebration packages with everything you need for a memorable Sallah', 'kayan-sallah', false),
('2', 'Kayan Lefe', 'Complete wedding packages for the perfect celebration of love', 'kayan-lefe', false),
('3', 'Haihuwa', 'Beautiful baby shower and naming ceremony packages', 'haihuwa', true),
('4', 'Seasonal Packages', 'Special limited-time packages for various occasions throughout the year', 'seasonal', true)
ON CONFLICT (id) DO UPDATE SET 
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  is_coming_soon = EXCLUDED.is_coming_soon;

-- 3. Enable RLS and set policies
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories"
  ON public.categories FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Super admin manage categories" ON public.categories;
CREATE POLICY "Super admin manage categories"
  ON public.categories FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- 4. Update existing tables RLS for Super Admin full access
-- PROFILES
DROP POLICY IF EXISTS "Super admin update any profile" ON public.profiles;
CREATE POLICY "Super admin manage all profiles"
  ON public.profiles FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- PACKAGES
DROP POLICY IF EXISTS "Admins manage packages" ON public.packages;
CREATE POLICY "Admins manage packages"
  ON public.packages FOR ALL
  USING (public.get_my_role() IN ('admin_ops', 'super_admin'));

-- ORDERS
DROP POLICY IF EXISTS "Admins manage all orders" ON public.orders;
CREATE POLICY "Super admin manage all orders"
  ON public.orders FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- DELIVERIES
DROP POLICY IF EXISTS "Admins manage deliveries" ON public.deliveries;
CREATE POLICY "Super admin manage deliveries"
  ON public.deliveries FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- AUDIT LOG
DROP POLICY IF EXISTS "Super admins manage audit log" ON public.audit_log;
CREATE POLICY "Super admins manage audit log"
  ON public.audit_log FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- ORDER MESSAGES
DROP POLICY IF EXISTS "Admins manage order messages" ON public.order_messages;
CREATE POLICY "Super admin manage order messages"
  ON public.order_messages FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- CHAT MESSAGES (if exists)
DO $$ BEGIN
  ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN undefined_table THEN NULL; END $$;

-- 5. Storage Buckets (Ensure they allow Super Admin)
INSERT INTO storage.buckets (id, name, public)
VALUES ('category-images', 'category-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Super admin manage category images" ON storage.objects;
CREATE POLICY "Super admin manage category images"
  ON storage.objects FOR ALL
  USING (bucket_id = 'category-images' AND public.get_my_role() = 'super_admin');

DROP POLICY IF EXISTS "Public read category images" ON storage.objects;
CREATE POLICY "Public read category images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'category-images');
