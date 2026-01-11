-- Fix the security definer view warning by using SECURITY INVOKER instead
-- But ensure the underlying RLS policy works correctly for anon

-- Drop and recreate the view with SECURITY INVOKER
DROP VIEW IF EXISTS public.public_portfolios;

CREATE VIEW public.public_portfolios 
WITH (security_invoker = true) AS
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

-- The key fix: ensure the anon policy on portfolios also applies to 'public' role
-- and verify the existing policy is correctly scoped
DROP POLICY IF EXISTS "Anon can view published portfolios" ON public.portfolios;

-- Recreate with explicit TO anon, public clause
CREATE POLICY "Anon can view published portfolios"
    ON public.portfolios
    FOR SELECT
    TO anon
    USING (status = 'published');

-- Also add a policy for unauthenticated public access (same as anon in Supabase)
-- This ensures both anon key access and truly unauthenticated access work
CREATE POLICY "Public can view published portfolios"
    ON public.portfolios
    FOR SELECT
    TO public
    USING (status = 'published');