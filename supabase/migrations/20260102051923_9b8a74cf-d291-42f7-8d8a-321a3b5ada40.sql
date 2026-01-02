-- Create a function to assign admin role to specific emails
CREATE OR REPLACE FUNCTION public.assign_admin_by_email()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_emails text[] := ARRAY['sarvesh3814@gmail.com'];
  user_email text;
BEGIN
  -- Get the user's email from auth.users
  SELECT email INTO user_email
  FROM auth.users
  WHERE id = NEW.user_id;
  
  -- Check if this email should be an admin
  IF user_email = ANY(admin_emails) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.user_id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to run on profile creation
DROP TRIGGER IF EXISTS assign_admin_on_signup ON public.profiles;
CREATE TRIGGER assign_admin_on_signup
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_by_email();

-- Also assign admin role to existing user if they exist
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'sarvesh3814@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;