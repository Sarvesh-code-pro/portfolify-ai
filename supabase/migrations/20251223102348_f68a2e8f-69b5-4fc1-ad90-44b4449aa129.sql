-- Add resume storage to portfolios
ALTER TABLE public.portfolios 
ADD COLUMN resume_text TEXT,
ADD COLUMN resume_file_url TEXT,
ADD COLUMN resume_updated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN quality_score INTEGER,
ADD COLUMN quality_suggestions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN parent_portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
ADD COLUMN version_name TEXT,
ADD COLUMN version_emphasis TEXT;

-- Create analytics table for portfolio views
CREATE TABLE public.portfolio_analytics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  view_date DATE NOT NULL DEFAULT CURRENT_DATE,
  view_count INTEGER NOT NULL DEFAULT 0,
  unique_visitors INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(portfolio_id, view_date)
);

-- Create table for link click tracking
CREATE TABLE public.portfolio_link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  portfolio_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL,
  link_url TEXT NOT NULL,
  click_count INTEGER NOT NULL DEFAULT 0,
  last_clicked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(portfolio_id, link_type, link_url)
);

-- Enable RLS on new tables
ALTER TABLE public.portfolio_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_link_clicks ENABLE ROW LEVEL SECURITY;

-- RLS policies for portfolio_analytics
CREATE POLICY "Portfolio owners can view their analytics"
ON public.portfolio_analytics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE portfolios.id = portfolio_analytics.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert analytics for published portfolios"
ON public.portfolio_analytics
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE portfolios.id = portfolio_analytics.portfolio_id 
    AND portfolios.status = 'published'
  )
);

CREATE POLICY "Anyone can update analytics for published portfolios"
ON public.portfolio_analytics
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE portfolios.id = portfolio_analytics.portfolio_id 
    AND portfolios.status = 'published'
  )
);

-- RLS policies for portfolio_link_clicks
CREATE POLICY "Portfolio owners can view their link clicks"
ON public.portfolio_link_clicks
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE portfolios.id = portfolio_link_clicks.portfolio_id 
    AND portfolios.user_id = auth.uid()
  )
);

CREATE POLICY "Anyone can insert link clicks for published portfolios"
ON public.portfolio_link_clicks
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE portfolios.id = portfolio_link_clicks.portfolio_id 
    AND portfolios.status = 'published'
  )
);

CREATE POLICY "Anyone can update link clicks for published portfolios"
ON public.portfolio_link_clicks
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.portfolios 
    WHERE portfolios.id = portfolio_link_clicks.portfolio_id 
    AND portfolios.status = 'published'
  )
);

-- Create index for faster analytics queries
CREATE INDEX idx_portfolio_analytics_portfolio_date ON public.portfolio_analytics(portfolio_id, view_date);
CREATE INDEX idx_portfolio_link_clicks_portfolio ON public.portfolio_link_clicks(portfolio_id);