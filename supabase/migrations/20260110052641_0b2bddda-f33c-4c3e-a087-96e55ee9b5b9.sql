-- Fix PUBLIC_DATA_EXPOSURE: Create a view for public portfolio access
-- This excludes sensitive columns (user_id, resume_text, resume_file_url, parent_portfolio_id, workspace_id)

-- Create view for public portfolio access (excludes PII)
CREATE OR REPLACE VIEW public.public_portfolios AS
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
  -- Explicitly excluded: user_id, resume_text, resume_file_url, parent_portfolio_id, workspace_id, quality_suggestions
FROM public.portfolios
WHERE status = 'published';

-- Grant access to the view for anonymous and authenticated users
GRANT SELECT ON public.public_portfolios TO anon, authenticated;

-- Drop the overly permissive RLS policy on the base table
DROP POLICY IF EXISTS "Anyone can view published portfolios" ON public.portfolios;