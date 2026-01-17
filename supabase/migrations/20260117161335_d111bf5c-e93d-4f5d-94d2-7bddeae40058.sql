-- Create packages table for admin management
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  class_image_url TEXT,
  has_classes BOOLEAN NOT NULL DEFAULT true,
  base_price NUMERIC,
  starting_price NUMERIC,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create package_classes table for class tiers
CREATE TABLE public.package_classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  package_id UUID NOT NULL REFERENCES public.packages(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.package_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for packages - everyone can read visible packages
CREATE POLICY "Anyone can view visible packages" 
ON public.packages 
FOR SELECT 
USING (is_hidden = false);

-- Admins can view all packages including hidden
CREATE POLICY "Admins can view all packages" 
ON public.packages 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can insert packages
CREATE POLICY "Admins can insert packages" 
ON public.packages 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Admins can update packages
CREATE POLICY "Admins can update packages" 
ON public.packages 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Admins can delete packages
CREATE POLICY "Admins can delete packages" 
ON public.packages 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for package_classes
CREATE POLICY "Anyone can view package classes" 
ON public.package_classes 
FOR SELECT 
USING (true);

CREATE POLICY "Admins can insert package classes" 
ON public.package_classes 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update package classes" 
ON public.package_classes 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete package classes" 
ON public.package_classes 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Create updated_at trigger for packages
CREATE TRIGGER update_packages_updated_at
BEFORE UPDATE ON public.packages
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add custom_request column to orders for custom class option
ALTER TABLE public.orders ADD COLUMN custom_request TEXT;