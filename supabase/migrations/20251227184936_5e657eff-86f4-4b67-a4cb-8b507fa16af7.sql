-- Add new columns for enhanced portfolio features
ALTER TABLE public.portfolios
  ADD COLUMN IF NOT EXISTS profile_picture_url TEXT,
  ADD COLUMN IF NOT EXISTS testimonials JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS certificates JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS custom_sections JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS section_order JSONB DEFAULT '["hero", "about", "skills", "projects", "experience", "education", "testimonials", "contact"]'::jsonb,
  ADD COLUMN IF NOT EXISTS section_visibility JSONB DEFAULT '{"hero": true, "about": true, "skills": true, "projects": true, "experience": true, "education": true, "testimonials": true, "contact": true}'::jsonb,
  ADD COLUMN IF NOT EXISTS section_titles JSONB DEFAULT '{"hero": "Hero", "about": "About", "skills": "Skills", "projects": "Projects", "experience": "Experience", "education": "Education", "testimonials": "Testimonials", "contact": "Contact"}'::jsonb,
  ADD COLUMN IF NOT EXISTS contact_settings JSONB DEFAULT '{"email": null, "whatsapp": null, "show_form": true, "sticky_button": false}'::jsonb,
  ADD COLUMN IF NOT EXISTS seo_settings JSONB DEFAULT '{"meta_title": null, "meta_description": null, "favicon_url": null, "og_image_url": null}'::jsonb,
  ADD COLUMN IF NOT EXISTS color_mode TEXT DEFAULT 'dark',
  ADD COLUMN IF NOT EXISTS version_history JSONB DEFAULT '[]'::jsonb;

-- Create portfolio_links table for multiple shareable links
CREATE TABLE IF NOT EXISTS public.portfolio_links (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL DEFAULT 'Main Link',
  section_visibility JSONB DEFAULT '{"hero": true, "about": true, "skills": true, "projects": true, "experience": true, "education": true, "testimonials": true, "contact": true}'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on portfolio_links
ALTER TABLE public.portfolio_links ENABLE ROW LEVEL SECURITY;

-- RLS policies for portfolio_links
CREATE POLICY "Users can view their own links" 
  ON public.portfolio_links 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own links" 
  ON public.portfolio_links 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own links" 
  ON public.portfolio_links 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own links" 
  ON public.portfolio_links 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Public can view active links for published portfolios
CREATE POLICY "Anyone can view active links for published portfolios" 
  ON public.portfolio_links 
  FOR SELECT 
  USING (
    is_active = true AND EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = portfolio_links.portfolio_id 
      AND portfolios.status = 'published'
    )
  );

-- Create storage bucket for portfolio assets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'portfolio-assets', 
  'portfolio-assets', 
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for portfolio assets
CREATE POLICY "Users can upload their own portfolio assets"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'portfolio-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own portfolio assets"
  ON storage.objects
  FOR UPDATE
  USING (
    bucket_id = 'portfolio-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own portfolio assets"
  ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'portfolio-assets' AND 
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view portfolio assets"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'portfolio-assets');

-- Add trigger for updated_at on portfolio_links
CREATE TRIGGER update_portfolio_links_updated_at
  BEFORE UPDATE ON public.portfolio_links
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();