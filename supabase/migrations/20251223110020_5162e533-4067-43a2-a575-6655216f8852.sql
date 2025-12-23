-- Add A/B testing support table
CREATE TABLE public.portfolio_ab_tests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed')),
  version_a_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  version_b_id UUID NOT NULL REFERENCES public.portfolios(id) ON DELETE CASCADE,
  traffic_split INTEGER NOT NULL DEFAULT 50 CHECK (traffic_split >= 0 AND traffic_split <= 100),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.portfolio_ab_tests ENABLE ROW LEVEL SECURITY;

-- Users can view their own A/B tests
CREATE POLICY "Users can view their own AB tests"
ON public.portfolio_ab_tests
FOR SELECT
USING (auth.uid() = user_id);

-- Users can create their own A/B tests
CREATE POLICY "Users can create their own AB tests"
ON public.portfolio_ab_tests
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own A/B tests
CREATE POLICY "Users can update their own AB tests"
ON public.portfolio_ab_tests
FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own A/B tests
CREATE POLICY "Users can delete their own AB tests"
ON public.portfolio_ab_tests
FOR DELETE
USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE TRIGGER update_portfolio_ab_tests_updated_at
BEFORE UPDATE ON public.portfolio_ab_tests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_portfolio_ab_tests_user ON public.portfolio_ab_tests(user_id);
CREATE INDEX idx_portfolio_ab_tests_status ON public.portfolio_ab_tests(status);