-- Fix: Create the view as SECURITY DEFINER owned by postgres to bypass RLS
-- This is safe because the view already filters to only published portfolios
-- and excludes sensitive columns (user_id, resume_text, etc.)

DROP VIEW IF EXISTS public.public_portfolios;

-- Create as regular view (SECURITY DEFINER by default when owned by postgres)
CREATE VIEW public.public_portfolios AS
SELECT 
    id, username, role, status, hero_title, hero_subtitle, about_text,
    skills, projects, experience, education, links, theme, template,
    profile_picture_url, testimonials, contact_settings, seo_settings,
    section_visibility, section_titles, published_at, quality_score,
    created_at, updated_at, certificates, custom_sections, section_order,
    color_mode, version_history, version_name, version_emphasis
FROM portfolios
WHERE status = 'published';

-- Grant access
GRANT SELECT ON public.public_portfolios TO anon;
GRANT SELECT ON public.public_portfolios TO authenticated;