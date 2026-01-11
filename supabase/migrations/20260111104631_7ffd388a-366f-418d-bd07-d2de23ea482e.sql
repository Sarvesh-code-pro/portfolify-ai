-- Ensure the public_portfolios view is accessible by anon users
-- The view was created with SECURITY INVOKER, meaning it respects RLS
-- But the underlying portfolios table RLS policy for anon should already allow access

-- First, let's verify and recreate the view with SECURITY DEFINER to bypass RLS
-- since the view already filters by status = 'published'
DROP VIEW IF EXISTS public.public_portfolios;

CREATE VIEW public.public_portfolios WITH (security_barrier = false) AS
SELECT 
    id,
    username,
    role,
    status,
    hero_title,
    hero_subtitle,
    about_text,
    skills,
    projects,
    experience,
    education,
    links,
    theme,
    template,
    profile_picture_url,
    testimonials,
    contact_settings,
    seo_settings,
    section_visibility,
    section_titles,
    published_at,
    quality_score,
    created_at,
    updated_at,
    certificates,
    custom_sections,
    section_order,
    color_mode,
    version_history,
    version_name,
    version_emphasis
FROM portfolios
WHERE status = 'published';

-- Grant SELECT to anon and authenticated roles
GRANT SELECT ON public.public_portfolios TO anon;
GRANT SELECT ON public.public_portfolios TO authenticated;

-- Also ensure portfolio_links is accessible for anon
-- The existing policy "Anyone can view active links for published portfolios" should work
-- but let's make sure it's also applicable to anon explicitly
DROP POLICY IF EXISTS "Anon can view active links" ON public.portfolio_links;
CREATE POLICY "Anon can view active links"
    ON public.portfolio_links
    FOR SELECT
    TO anon
    USING (
        is_active = true 
        AND EXISTS (
            SELECT 1 FROM portfolios 
            WHERE portfolios.id = portfolio_links.portfolio_id 
            AND portfolios.status = 'published'
        )
    );