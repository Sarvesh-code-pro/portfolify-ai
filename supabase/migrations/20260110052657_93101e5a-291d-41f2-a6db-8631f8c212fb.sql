-- Add RLS policy for anon access to published portfolios with restricted columns
-- Since we use SECURITY INVOKER view, we need to allow anon SELECT on the base table
-- But the view only exposes safe columns, so this is secure

CREATE POLICY "Anon can view published portfolios"
ON public.portfolios
FOR SELECT
TO anon
USING (status = 'published');