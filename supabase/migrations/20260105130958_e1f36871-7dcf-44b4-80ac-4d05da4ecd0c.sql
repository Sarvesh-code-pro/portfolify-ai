-- Fix workspace_members insert policy to allow invites with a temporary user_id
-- The issue is that when inviting by email, we need to store a placeholder user_id
-- but the invited user hasn't been assigned yet

-- Drop and recreate the insert policy to be more flexible
DROP POLICY IF EXISTS "Workspace owners and admins can add members" ON public.workspace_members;

CREATE POLICY "Workspace owners and admins can add members" 
ON public.workspace_members 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM workspaces w
    WHERE w.id = workspace_members.workspace_id 
    AND (
      w.owner_id = auth.uid() 
      OR get_workspace_role(auth.uid(), workspace_members.workspace_id) = ANY (ARRAY['owner'::workspace_role, 'admin'::workspace_role])
    )
  )
);