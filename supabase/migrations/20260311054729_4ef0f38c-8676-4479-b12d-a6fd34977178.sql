
DROP VIEW IF EXISTS public.public_portfolios;

CREATE VIEW public.public_portfolios WITH (security_invoker = true) AS
SELECT 
  id, username, role, status, hero_title, hero_subtitle, about_text,
  skills, projects, experience, education, links, theme, template,
  profile_picture_url, color_mode, testimonials, certificates,
  custom_sections, section_order, section_visibility, section_titles,
  contact_settings, seo_settings, version_history, version_name,
  version_emphasis, quality_score, published_at, created_at, updated_at,
  custom_domain
FROM public.portfolios
WHERE status = 'published';
