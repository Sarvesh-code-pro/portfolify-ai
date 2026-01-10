-- Fix SECURITY DEFINER view warning by using SECURITY INVOKER
DROP VIEW IF EXISTS public.public_portfolios;

CREATE VIEW public.public_portfolios
WITH (security_invoker = true)
AS
SELECT 
  id, username, role, status,
  hero_title, hero_subtitle, about_text,
  skills, projects, experience, education,
  links, theme, template, profile_picture_url,
  testimonials, contact_settings, seo_settings,
  section_visibility, section_titles,
  published_at, quality_score,
  created_at, updated_at,
  certificates, custom_sections, section_order,
  color_mode, version_history, version_name, version_emphasis
FROM public.portfolios
WHERE status = 'published';

-- Re-grant access to the view
GRANT SELECT ON public.public_portfolios TO anon, authenticated;