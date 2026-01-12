-- Grant SELECT permission on public_portfolios view to anon and authenticated roles
GRANT SELECT ON public.public_portfolios TO anon;
GRANT SELECT ON public.public_portfolios TO authenticated;