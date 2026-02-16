-- ============================================================
-- 1. BRANDED ORDER ID SYSTEM
-- Generates IDs in format: MAG/KN/YY/NNNNN
-- ============================================================

-- Counter table for sequential order IDs per year
CREATE TABLE IF NOT EXISTS public.order_counters (
  year INT PRIMARY KEY,
  counter INT DEFAULT 0
);

-- Allow all authenticated users to call the RPC (needed for order creation)
ALTER TABLE public.order_counters ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role can manage order_counters"
  ON public.order_counters FOR ALL
  USING (true) WITH CHECK (true);

-- Atomic function to generate branded order IDs
CREATE OR REPLACE FUNCTION public.generate_custom_order_id()
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_yr INT := EXTRACT(YEAR FROM NOW())::INT % 100;
  new_counter INT;
BEGIN
  INSERT INTO public.order_counters (year, counter)
  VALUES (current_yr, 1)
  ON CONFLICT (year) DO UPDATE SET counter = order_counters.counter + 1
  RETURNING counter INTO new_counter;
  
  RETURN 'MAG/KN/' || LPAD(current_yr::TEXT, 2, '0') || '/' || LPAD(new_counter::TEXT, 5, '0');
END;
$$;

-- Seed the counter for the current year
INSERT INTO public.order_counters (year, counter)
VALUES (26, 0)
ON CONFLICT (year) DO NOTHING;


-- ============================================================
-- 2. GLOBAL CHAT SYSTEM
-- Replaces per-order messaging with global customer-admin chat
-- ============================================================

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  message TEXT,
  image_url TEXT,
  sender_role TEXT DEFAULT 'customer',
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Customers can view their own chat messages
CREATE POLICY "Users can view own chat"
  ON public.chat_messages FOR SELECT
  USING (
    user_id = auth.uid() 
    OR sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_ops', 'super_admin')
    )
  );

-- Authenticated users can send messages
CREATE POLICY "Users can send messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- Users and admins can update messages (for read status)
CREATE POLICY "Users and admins can update messages"
  ON public.chat_messages FOR UPDATE
  USING (
    user_id = auth.uid()
    OR sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_ops', 'super_admin')
    )
  );


-- ============================================================
-- 3. PAYMENT SETTINGS TABLE + DATA
-- ============================================================

CREATE TABLE IF NOT EXISTS public.payment_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bank_name TEXT NOT NULL DEFAULT 'Moniepoint',
  account_name TEXT NOT NULL DEFAULT 'M. Abba Gallery',
  account_number TEXT NOT NULL DEFAULT '5024793663',
  additional_note TEXT DEFAULT 'Send proof of payment after transfer.',
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view payment settings"
  ON public.payment_settings FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage payment settings"
  ON public.payment_settings FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('admin_ops', 'super_admin')
    )
  );

-- Seed with default bank details
INSERT INTO public.payment_settings (bank_name, account_name, account_number, additional_note)
VALUES ('Moniepoint', 'M. Abba Gallery', '5024793663', 'Send proof of payment after transfer.')
ON CONFLICT DO NOTHING;
