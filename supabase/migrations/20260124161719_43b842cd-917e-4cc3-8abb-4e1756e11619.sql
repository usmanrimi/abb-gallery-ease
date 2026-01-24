-- Create storage bucket for package images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('package-images', 'package-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for package image uploads (admin only)
CREATE POLICY "Admins can upload package images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'package-images' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can update package images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'package-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete package images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'package-images'
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Anyone can view package images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'package-images');