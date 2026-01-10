-- Fix linter WARN: avoid WITH CHECK (true) on contact_messages insert
-- Keep public contact form, but prevent spoofing user_id.

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (
  -- allow anonymous submissions (user_id null)
  user_id IS NULL
  OR
  -- allow authenticated submissions bound to their own user_id
  user_id = auth.uid()
);
