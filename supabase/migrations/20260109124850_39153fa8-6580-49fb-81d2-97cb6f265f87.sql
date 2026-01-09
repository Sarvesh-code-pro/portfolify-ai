-- Drop and recreate the INSERT policy with a simpler check
-- The issue is that get_workspace_role requires the user to already be a member
DROP POLICY IF EXISTS "Workspace owners and admins can add members" ON public.workspace_members;

CREATE POLICY "Workspace owners and admins can add members" 
ON public.workspace_members 
FOR INSERT 
WITH CHECK (
  -- Allow if user is the owner of the workspace
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_id AND w.owner_id = auth.uid()
  )
  OR
  -- Or if user is already an admin member of the workspace
  EXISTS (
    SELECT 1 FROM public.workspace_members wm
    WHERE wm.workspace_id = workspace_members.workspace_id
      AND wm.user_id = auth.uid()
      AND wm.invite_accepted = true
      AND wm.role IN ('owner', 'admin')
  )
);