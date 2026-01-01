-- Create user roles enum
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

-- Create user_roles table for admin access
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles (avoids RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles
FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

-- Create workspaces table
CREATE TABLE public.workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on workspaces
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;

-- Create workspace_members table with roles
CREATE TYPE public.workspace_role AS ENUM ('owner', 'admin', 'editor', 'viewer');

CREATE TABLE public.workspace_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role workspace_role NOT NULL DEFAULT 'viewer',
  invited_email TEXT,
  invite_accepted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (workspace_id, user_id)
);

-- Enable RLS on workspace_members
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

-- Function to check workspace membership
CREATE OR REPLACE FUNCTION public.is_workspace_member(_user_id UUID, _workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.workspace_members
    WHERE user_id = _user_id
      AND workspace_id = _workspace_id
      AND invite_accepted = true
  )
$$;

-- Function to check workspace role
CREATE OR REPLACE FUNCTION public.get_workspace_role(_user_id UUID, _workspace_id UUID)
RETURNS workspace_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role
  FROM public.workspace_members
  WHERE user_id = _user_id
    AND workspace_id = _workspace_id
    AND invite_accepted = true
$$;

-- RLS policies for workspaces
CREATE POLICY "Users can view workspaces they belong to"
ON public.workspaces
FOR SELECT
USING (
  owner_id = auth.uid() OR
  public.is_workspace_member(auth.uid(), id)
);

CREATE POLICY "Users can create workspaces"
ON public.workspaces
FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Workspace owners and admins can update"
ON public.workspaces
FOR UPDATE
USING (
  owner_id = auth.uid() OR
  public.get_workspace_role(auth.uid(), id) IN ('owner', 'admin')
);

CREATE POLICY "Only workspace owners can delete"
ON public.workspaces
FOR DELETE
USING (owner_id = auth.uid());

-- RLS policies for workspace_members
CREATE POLICY "Members can view their workspace members"
ON public.workspace_members
FOR SELECT
USING (
  user_id = auth.uid() OR
  public.is_workspace_member(auth.uid(), workspace_id)
);

CREATE POLICY "Workspace owners and admins can add members"
ON public.workspace_members
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_id AND (
      w.owner_id = auth.uid() OR
      public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin')
    )
  )
);

CREATE POLICY "Workspace owners and admins can update members"
ON public.workspace_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_id AND (
      w.owner_id = auth.uid() OR
      public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin')
    )
  ) OR user_id = auth.uid()
);

CREATE POLICY "Workspace owners and admins can remove members"
ON public.workspace_members
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.workspaces w
    WHERE w.id = workspace_id AND (
      w.owner_id = auth.uid() OR
      public.get_workspace_role(auth.uid(), workspace_id) IN ('owner', 'admin')
    )
  ) OR user_id = auth.uid()
);

-- Add workspace_id to portfolios for workspace-based sharing
ALTER TABLE public.portfolios ADD COLUMN workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- Create contact_messages table for support
CREATE TABLE public.contact_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  admin_response TEXT,
  responded_at TIMESTAMP WITH TIME ZONE,
  responded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on contact_messages
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;

-- RLS policies for contact_messages
CREATE POLICY "Users can view their own messages"
ON public.contact_messages
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Anyone can submit contact messages"
ON public.contact_messages
FOR INSERT
WITH CHECK (true);

CREATE POLICY "Admins can view all messages"
ON public.contact_messages
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update messages"
ON public.contact_messages
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'));

-- Add onboarding fields to profiles table
ALTER TABLE public.profiles ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN onboarding_step INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN profile_picture_url TEXT;

-- Create trigger for updated_at on new tables
CREATE TRIGGER update_workspaces_updated_at
  BEFORE UPDATE ON public.workspaces
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_workspace_members_updated_at
  BEFORE UPDATE ON public.workspace_members
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contact_messages_updated_at
  BEFORE UPDATE ON public.contact_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();