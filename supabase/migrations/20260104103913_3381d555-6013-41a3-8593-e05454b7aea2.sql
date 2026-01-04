-- Create resumes table for storing multiple resume versions per user
CREATE TABLE public.resumes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  portfolio_id UUID REFERENCES public.portfolios(id) ON DELETE SET NULL,
  name TEXT NOT NULL DEFAULT 'My Resume',
  target_role TEXT,
  target_company TEXT,
  job_description TEXT,
  template TEXT NOT NULL DEFAULT 'classic',
  page_limit INTEGER NOT NULL DEFAULT 1 CHECK (page_limit IN (1, 2)),
  ats_score INTEGER,
  ats_suggestions JSONB,
  -- Content overrides (if null, uses portfolio data)
  summary_override TEXT,
  experience_override JSONB,
  skills_override JSONB,
  projects_override JSONB,
  education_override JSONB,
  -- Contact info
  contact_email TEXT,
  contact_phone TEXT,
  contact_linkedin TEXT,
  contact_github TEXT,
  contact_website TEXT,
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_exported_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own resumes" 
ON public.resumes 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resumes" 
ON public.resumes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own resumes" 
ON public.resumes 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resumes" 
ON public.resumes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create resume versions table for undo/history
CREATE TABLE public.resume_versions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  resume_id UUID NOT NULL REFERENCES public.resumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  snapshot JSONB NOT NULL,
  label TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.resume_versions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own resume versions" 
ON public.resume_versions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own resume versions" 
ON public.resume_versions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own resume versions" 
ON public.resume_versions 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for updated_at on resumes
CREATE TRIGGER update_resumes_updated_at
BEFORE UPDATE ON public.resumes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add index for faster lookups
CREATE INDEX idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX idx_resumes_portfolio_id ON public.resumes(portfolio_id);
CREATE INDEX idx_resume_versions_resume_id ON public.resume_versions(resume_id);