
-- Update existing 'admin' roles to 'admin_ops'
UPDATE public.user_roles SET role = 'admin_ops' WHERE role = 'admin';

-- Recreate get_user_role function to handle admin_ops
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
 RETURNS app_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _user_id = auth.uid() OR EXISTS(
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin_ops', 'super_admin')
    ) THEN (
      SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
    )
    ELSE NULL
  END
$$;

-- Recreate has_role function
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT CASE
    WHEN _user_id = auth.uid() OR EXISTS(
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role IN ('admin_ops', 'super_admin')
    ) THEN EXISTS (
      SELECT 1
      FROM public.user_roles
      WHERE user_id = _user_id AND role = _role
    )
    ELSE false
  END
$$;

-- packages table
DROP POLICY IF EXISTS "Admins can delete packages" ON public.packages;
CREATE POLICY "Admins can delete packages" ON public.packages FOR DELETE USING (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can insert packages" ON public.packages;
CREATE POLICY "Admins can insert packages" ON public.packages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can update packages" ON public.packages;
CREATE POLICY "Admins can update packages" ON public.packages FOR UPDATE USING (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can view all packages" ON public.packages;
CREATE POLICY "Admins can view all packages" ON public.packages FOR SELECT USING (has_role(auth.uid(), 'admin_ops'::app_role));

-- package_classes table
DROP POLICY IF EXISTS "Admins can delete package classes" ON public.package_classes;
CREATE POLICY "Admins can delete package classes" ON public.package_classes FOR DELETE USING (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can insert package classes" ON public.package_classes;
CREATE POLICY "Admins can insert package classes" ON public.package_classes FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can update package classes" ON public.package_classes;
CREATE POLICY "Admins can update package classes" ON public.package_classes FOR UPDATE USING (has_role(auth.uid(), 'admin_ops'::app_role));

-- orders table
DROP POLICY IF EXISTS "Admins can update any order" ON public.orders;
CREATE POLICY "Admins can update any order" ON public.orders FOR UPDATE USING (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can view all orders" ON public.orders;
CREATE POLICY "Admins can view all orders" ON public.orders FOR SELECT USING (has_role(auth.uid(), 'admin_ops'::app_role));

-- order_messages table
DROP POLICY IF EXISTS "Admins can send messages" ON public.order_messages;
CREATE POLICY "Admins can send messages" ON public.order_messages FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_ops'::app_role) AND (sender_role = 'admin'::text));

DROP POLICY IF EXISTS "Admins can update any message" ON public.order_messages;
CREATE POLICY "Admins can update any message" ON public.order_messages FOR UPDATE USING (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can view all messages" ON public.order_messages;
CREATE POLICY "Admins can view all messages" ON public.order_messages FOR SELECT USING (has_role(auth.uid(), 'admin_ops'::app_role));

-- deliveries table
DROP POLICY IF EXISTS "Admins can delete deliveries" ON public.deliveries;
CREATE POLICY "Admins can delete deliveries" ON public.deliveries FOR DELETE USING (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can insert deliveries" ON public.deliveries;
CREATE POLICY "Admins can insert deliveries" ON public.deliveries FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can update deliveries" ON public.deliveries;
CREATE POLICY "Admins can update deliveries" ON public.deliveries FOR UPDATE USING (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can view all deliveries" ON public.deliveries;
CREATE POLICY "Admins can view all deliveries" ON public.deliveries FOR SELECT USING (has_role(auth.uid(), 'admin_ops'::app_role));

-- notifications table
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications" ON public.notifications FOR SELECT USING (has_role(auth.uid(), 'admin_ops'::app_role));

-- user_roles table
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin_ops'::app_role));

-- payment_settings table
DROP POLICY IF EXISTS "Admins can insert payment settings" ON public.payment_settings;
CREATE POLICY "Admins can insert payment settings" ON public.payment_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can update payment settings" ON public.payment_settings;
CREATE POLICY "Admins can update payment settings" ON public.payment_settings FOR UPDATE USING (has_role(auth.uid(), 'admin_ops'::app_role));

-- category_settings table
DROP POLICY IF EXISTS "Admins can insert category settings" ON public.category_settings;
CREATE POLICY "Admins can insert category settings" ON public.category_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_ops'::app_role));

DROP POLICY IF EXISTS "Admins can update category settings" ON public.category_settings;
CREATE POLICY "Admins can update category settings" ON public.category_settings FOR UPDATE USING (has_role(auth.uid(), 'admin_ops'::app_role));

-- audit_log table
DROP POLICY IF EXISTS "Admins can insert audit logs" ON public.audit_log;
CREATE POLICY "Admins can insert audit logs" ON public.audit_log FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin_ops'::app_role) OR has_role(auth.uid(), 'super_admin'::app_role));

-- Super admin full CRUD on packages
CREATE POLICY "Super admins can insert packages" ON public.packages FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can update packages" ON public.packages FOR UPDATE USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can delete packages" ON public.packages FOR DELETE USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admin CRUD on package_classes
CREATE POLICY "Super admins can view package classes" ON public.package_classes FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can insert package classes" ON public.package_classes FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can update package classes" ON public.package_classes FOR UPDATE USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can delete package classes" ON public.package_classes FOR DELETE USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admin on order_messages
CREATE POLICY "Super admins can send messages" ON public.order_messages FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role) AND (sender_role = 'admin'::text));
CREATE POLICY "Super admins can update messages" ON public.order_messages FOR UPDATE USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admin on deliveries
CREATE POLICY "Super admins can insert deliveries" ON public.deliveries FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can update deliveries" ON public.deliveries FOR UPDATE USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can delete deliveries" ON public.deliveries FOR DELETE USING (has_role(auth.uid(), 'super_admin'::app_role));

-- Super admin on notifications
CREATE POLICY "Super admins can create notifications" ON public.notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- Drop duplicate super admin select policies that already exist, then recreate cleanly
DROP POLICY IF EXISTS "Super admins can view all notifications" ON public.notifications;
CREATE POLICY "Super admins can view all notifications" ON public.notifications FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));

DROP POLICY IF EXISTS "Super admins can insert payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Super admins can update payment settings" ON public.payment_settings;
DROP POLICY IF EXISTS "Super admins can view payment settings" ON public.payment_settings;
CREATE POLICY "Super admins can insert payment settings" ON public.payment_settings FOR INSERT WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can update payment settings" ON public.payment_settings FOR UPDATE USING (has_role(auth.uid(), 'super_admin'::app_role));
CREATE POLICY "Super admins can view payment settings" ON public.payment_settings FOR SELECT USING (has_role(auth.uid(), 'super_admin'::app_role));
