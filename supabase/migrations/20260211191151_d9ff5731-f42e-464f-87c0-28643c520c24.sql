
-- Create audit_log table
CREATE TABLE public.audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  user_name text,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id text,
  details text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Only super_admin can view audit logs
CREATE POLICY "Super admins can view audit logs"
  ON public.audit_log FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- Admins and super_admins can insert audit logs
CREATE POLICY "Admins can insert audit logs"
  ON public.audit_log FOR INSERT
  WITH CHECK (
    has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'super_admin')
  );

-- Super admins can view all profiles
CREATE POLICY "Super admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can update any profile
CREATE POLICY "Super admins can update any profile"
  ON public.profiles FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can view all roles
CREATE POLICY "Super admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can insert roles
CREATE POLICY "Super admins can insert roles"
  ON public.user_roles FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Super admins can update roles
CREATE POLICY "Super admins can update roles"
  ON public.user_roles FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can delete roles
CREATE POLICY "Super admins can delete roles"
  ON public.user_roles FOR DELETE
  USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can view all orders
CREATE POLICY "Super admins can view all orders"
  ON public.orders FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update all orders"
  ON public.orders FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can view all deliveries
CREATE POLICY "Super admins can view all deliveries"
  ON public.deliveries FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can view all packages
CREATE POLICY "Super admins can view all packages"
  ON public.packages FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- Super admins can view all notifications
CREATE POLICY "Super admins can view all notifications"
  ON public.notifications FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- Super admins payment settings access
CREATE POLICY "Super admins can view payment settings"
  ON public.payment_settings FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update payment settings"
  ON public.payment_settings FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert payment settings"
  ON public.payment_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Super admins category settings access
CREATE POLICY "Super admins can view category settings"
  ON public.category_settings FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can update category settings"
  ON public.category_settings FOR UPDATE
  USING (has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Super admins can insert category settings"
  ON public.category_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'super_admin'));

-- Super admins can view all order messages
CREATE POLICY "Super admins can view all messages"
  ON public.order_messages FOR SELECT
  USING (has_role(auth.uid(), 'super_admin'));

-- Indexes
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at DESC);
CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
