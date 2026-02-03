-- Create category settings table for Coming Soon toggle
CREATE TABLE public.category_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_slug text UNIQUE NOT NULL,
  coming_soon boolean NOT NULL DEFAULT false,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.category_settings ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view category settings"
ON public.category_settings
FOR SELECT
USING (true);

CREATE POLICY "Admins can update category settings"
ON public.category_settings
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert category settings"
ON public.category_settings
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Insert default values for seasonal and haihuwa (coming soon ON by default)
INSERT INTO public.category_settings (category_slug, coming_soon)
VALUES 
  ('seasonal', true),
  ('haihuwa', true),
  ('kayan-sallah', false),
  ('kayan-lefe', false)
ON CONFLICT (category_slug) DO NOTHING;