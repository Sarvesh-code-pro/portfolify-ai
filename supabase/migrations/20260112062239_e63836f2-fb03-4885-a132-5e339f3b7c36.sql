-- Grant SELECT permission on public_portfolios view to anon and authenticated roles
-- Dropping and recreating grants to ensure they exist
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT SELECT ON public.public_portfolios TO anon;
GRANT SELECT ON public.public_portfolios TO authenticated;

-- Also grant SELECT on portfolios table for the anon RLS policies to work
GRANT SELECT ON public.portfolios TO anon;