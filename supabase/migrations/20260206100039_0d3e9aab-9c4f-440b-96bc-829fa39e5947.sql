-- 1. Add custom order ID sequence and column
-- Create a sequence for order numbers
CREATE SEQUENCE IF NOT EXISTS order_number_seq START 1;

-- Add custom_order_id column to orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS custom_order_id TEXT UNIQUE;

-- Create function to generate custom order ID
CREATE OR REPLACE FUNCTION public.generate_custom_order_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  next_num INTEGER;
  order_id TEXT;
BEGIN
  next_num := nextval('order_number_seq');
  order_id := 'MAG/KN/26/' || LPAD(next_num::TEXT, 4, '0');
  RETURN order_id;
END;
$$;

-- Create trigger to auto-generate custom order ID on insert
CREATE OR REPLACE FUNCTION public.set_custom_order_id()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.custom_order_id IS NULL THEN
    NEW.custom_order_id := generate_custom_order_id();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_set_custom_order_id
BEFORE INSERT ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.set_custom_order_id();

-- 2. Add payment-related columns to orders
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending_payment',
ADD COLUMN IF NOT EXISTS payment_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
ADD COLUMN IF NOT EXISTS payment_proof_type TEXT,
ADD COLUMN IF NOT EXISTS payment_verified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS payment_verified_by UUID,
ADD COLUMN IF NOT EXISTS delivery_address TEXT,
ADD COLUMN IF NOT EXISTS delivery_notes TEXT;

-- 3. Create deliveries table
CREATE TABLE IF NOT EXISTS public.deliveries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  custom_order_id TEXT,
  customer_name TEXT NOT NULL,
  customer_whatsapp TEXT NOT NULL,
  package_name TEXT NOT NULL,
  delivery_address TEXT,
  delivery_notes TEXT,
  delivery_date DATE,
  delivery_time TEXT,
  status TEXT NOT NULL DEFAULT 'ready',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on deliveries
ALTER TABLE public.deliveries ENABLE ROW LEVEL SECURITY;

-- RLS policies for deliveries
CREATE POLICY "Admins can view all deliveries"
ON public.deliveries FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert deliveries"
ON public.deliveries FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update deliveries"
ON public.deliveries FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete deliveries"
ON public.deliveries FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own deliveries"
ON public.deliveries FOR SELECT
USING (EXISTS (
  SELECT 1 FROM orders 
  WHERE orders.id = deliveries.order_id 
  AND orders.user_id = auth.uid()
));

-- Trigger to update updated_at on deliveries
CREATE TRIGGER update_deliveries_updated_at
BEFORE UPDATE ON public.deliveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create function to auto-create delivery when order status changes
CREATE OR REPLACE FUNCTION public.handle_order_delivery()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- When order status becomes 'ready_for_delivery', 'out_for_delivery', or 'delivered' (delivery stages)
  IF NEW.status IN ('ready_for_delivery', 'out_for_delivery', 'confirmed', 'paid') 
     AND OLD.status NOT IN ('ready_for_delivery', 'out_for_delivery', 'confirmed', 'paid', 'delivered') THEN
    -- Check if delivery already exists
    IF NOT EXISTS (SELECT 1 FROM deliveries WHERE order_id = NEW.id) THEN
      INSERT INTO deliveries (
        order_id,
        custom_order_id,
        customer_name,
        customer_whatsapp,
        package_name,
        delivery_address,
        delivery_notes,
        delivery_date,
        delivery_time,
        status
      ) VALUES (
        NEW.id,
        NEW.custom_order_id,
        NEW.customer_name,
        NEW.customer_whatsapp,
        NEW.package_name,
        NEW.delivery_address,
        NEW.delivery_notes,
        NEW.delivery_date,
        NEW.delivery_time,
        'ready'
      );
    END IF;
  END IF;
  
  -- Update delivery status when order status changes
  IF NEW.status = 'out_for_delivery' THEN
    UPDATE deliveries SET status = 'out_for_delivery', updated_at = now() WHERE order_id = NEW.id;
  ELSIF NEW.status = 'delivered' THEN
    UPDATE deliveries SET status = 'delivered', updated_at = now() WHERE order_id = NEW.id;
  ELSIF NEW.status = 'cancelled' THEN
    UPDATE deliveries SET status = 'cancelled', updated_at = now() WHERE order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_order_delivery
AFTER UPDATE ON public.orders
FOR EACH ROW
EXECUTE FUNCTION public.handle_order_delivery();

-- 5. Create storage bucket for payment proofs
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('payment-proofs', 'payment-proofs', false, 20971520)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for payment proofs
CREATE POLICY "Users can upload payment proofs"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can view their own payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all payment proofs"
ON storage.objects FOR SELECT
USING (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete payment proofs"
ON storage.objects FOR DELETE
USING (bucket_id = 'payment-proofs' AND has_role(auth.uid(), 'admin'::app_role));

-- 6. Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON public.orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_custom_order_id ON public.orders(custom_order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON public.deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON public.deliveries(status);