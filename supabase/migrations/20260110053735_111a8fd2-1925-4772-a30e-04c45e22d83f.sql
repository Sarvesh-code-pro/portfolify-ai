-- Fix warn-level security issues

-- 1. Create admin_config table to replace hardcoded admin emails
CREATE TABLE IF NOT EXISTS public.admin_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  config_key text NOT NULL UNIQUE,
  config_value text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on admin_config
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Only admins can read admin_config
CREATE POLICY "Admins can read admin_config"
  ON public.admin_config
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- No one can modify admin_config through RLS (managed through migrations only)

-- Insert the admin email into config table
INSERT INTO public.admin_config (config_key, config_value)
VALUES ('admin_emails', 'sarvesh3814@gmail.com')
ON CONFLICT (config_key) DO NOTHING;

-- 2. Update the assign_admin_by_email function to use config table
CREATE OR REPLACE FUNCTION public.assign_admin_by_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_email_config text;
  admin_emails_array text[];
  user_email text;
BEGIN
  -- Get admin emails from config table
  SELECT config_value INTO admin_email_config
  FROM public.admin_config
  WHERE config_key = 'admin_emails';
  
  -- Convert comma-separated string to array
  IF admin_email_config IS NOT NULL THEN
    admin_emails_array := string_to_array(admin_email_config, ',');
    
    -- Trim whitespace from each email
    FOR i IN 1..array_length(admin_emails_array, 1) LOOP
      admin_emails_array[i] := trim(admin_emails_array[i]);
    END LOOP;
  ELSE
    admin_emails_array := ARRAY[]::text[];
  END IF;
  
  -- Get the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Check if this email should be an admin
  IF user_email = ANY(admin_emails_array) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 3. Add server-side storage policies with size and type restrictions
-- First, update the bucket to be properly configured
UPDATE storage.buckets
SET 
  file_size_limit = 5242880,  -- 5MB in bytes
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']::text[]
WHERE id = 'portfolio-assets';

-- 4. Add timestamp trigger for admin_config
CREATE TRIGGER update_admin_config_updated_at
  BEFORE UPDATE ON public.admin_config
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();