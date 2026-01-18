-- Create payment_settings table for admin-controlled bank transfer details
CREATE TABLE public.payment_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bank_name text NOT NULL DEFAULT 'Moniepoint',
  account_name text NOT NULL DEFAULT 'M. Abba Gallery',
  account_number text NOT NULL DEFAULT '5024793663',
  additional_note text DEFAULT 'Send proof of payment after transfer.',
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can read payment settings
CREATE POLICY "Anyone can view payment settings"
  ON public.payment_settings FOR SELECT
  USING (true);

-- Only admins can update payment settings
CREATE POLICY "Admins can update payment settings"
  ON public.payment_settings FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Only admins can insert payment settings
CREATE POLICY "Admins can insert payment settings"
  ON public.payment_settings FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default payment settings
INSERT INTO public.payment_settings (bank_name, account_name, account_number, additional_note)
VALUES ('Moniepoint', 'M. Abba Gallery', '5024793663', 'Send proof of payment after transfer.');

-- Create order_messages table for chat between admin and customer
CREATE TABLE public.order_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id uuid NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL CHECK (sender_role IN ('admin', 'customer')),
  message text,
  image_url text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.order_messages ENABLE ROW LEVEL SECURITY;

-- Enable realtime for order_messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.order_messages;

-- Users can view messages for their own orders
CREATE POLICY "Users can view their own order messages"
  ON public.order_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_messages.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Users can insert messages for their own orders
CREATE POLICY "Users can send messages on their orders"
  ON public.order_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_messages.order_id 
      AND orders.user_id = auth.uid()
    ) AND sender_role = 'customer'
  );

-- Admins can view all messages
CREATE POLICY "Admins can view all messages"
  ON public.order_messages FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can send messages
CREATE POLICY "Admins can send messages"
  ON public.order_messages FOR INSERT
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role) AND sender_role = 'admin');

-- Users can update their own messages (for marking as read)
CREATE POLICY "Users can update messages on their orders"
  ON public.order_messages FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.orders 
      WHERE orders.id = order_messages.order_id 
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can update any message
CREATE POLICY "Admins can update any message"
  ON public.order_messages FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin_set_price column to orders for custom pricing
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS admin_set_price numeric;