-- 1) Create a dedicated invites table (email-based) so we don't need fake user_id values
--    workspace_members.user_id has an auth.users FK, so placeholder UUIDs will ALWAYS fail.

create table if not exists public.workspace_invites (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  invited_email text not null,
  role public.workspace_role not null default 'viewer',
  invited_by uuid not null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  accepted_by uuid
);

-- Normalize invited_email (lowercase/trim) to avoid duplicates
create or replace function public.normalize_workspace_invite_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.invited_email := lower(trim(new.invited_email));
  return new;
end;
$$;

drop trigger if exists trg_normalize_workspace_invite_email on public.workspace_invites;
create trigger trg_normalize_workspace_invite_email
before insert or update on public.workspace_invites
for each row
execute function public.normalize_workspace_invite_email();

-- Only one *pending* invite per email per workspace
create unique index if not exists workspace_invites_unique_pending
on public.workspace_invites (workspace_id, invited_email)
where accepted_at is null;

alter table public.workspace_invites enable row level security;

-- Workspace admins (owner/admin) can create invites
drop policy if exists "Workspace admins can create invites" on public.workspace_invites;
create policy "Workspace admins can create invites"
on public.workspace_invites
for insert
with check (
  invited_by = auth.uid()
  and accepted_at is null
  and role <> 'owner'::workspace_role
  and (
    exists (
      select 1
      from public.workspaces w
      where w.id = workspace_id
        and w.owner_id = auth.uid()
    )
    or public.get_workspace_role(auth.uid(), workspace_id) in ('owner'::workspace_role, 'admin'::workspace_role)
  )
);

-- Workspace admins can view invites for their workspace
drop policy if exists "Workspace admins can view invites" on public.workspace_invites;
create policy "Workspace admins can view invites"
on public.workspace_invites
for select
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_id
      and w.owner_id = auth.uid()
  )
  or public.get_workspace_role(auth.uid(), workspace_id) in ('owner'::workspace_role, 'admin'::workspace_role)
);

-- Invited users can view their pending invites (by email)
drop policy if exists "Invited users can view their invites" on public.workspace_invites;
create policy "Invited users can view their invites"
on public.workspace_invites
for select
using (
  accepted_at is null
  and invited_email = lower(auth.jwt() ->> 'email')
);

-- Workspace admins can cancel (delete) invites
drop policy if exists "Workspace admins can cancel invites" on public.workspace_invites;
create policy "Workspace admins can cancel invites"
on public.workspace_invites
for delete
using (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_id
      and w.owner_id = auth.uid()
  )
  or public.get_workspace_role(auth.uid(), workspace_id) in ('owner'::workspace_role, 'admin'::workspace_role)
);

-- Invited users can decline (delete) their own pending invites
drop policy if exists "Invited users can decline invites" on public.workspace_invites;
create policy "Invited users can decline invites"
on public.workspace_invites
for delete
using (
  accepted_at is null
  and invited_email = lower(auth.jwt() ->> 'email')
);

-- 2) RPC to accept an invite securely (avoids giving broad UPDATE permissions)
create or replace function public.accept_workspace_invite(invite_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_invite public.workspace_invites%rowtype;
  v_user_id uuid;
  v_email text;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_email := lower(auth.jwt() ->> 'email');
  if v_email is null then
    raise exception 'Email not available';
  end if;

  select *
    into v_invite
  from public.workspace_invites
  where id = invite_id
    and accepted_at is null
  for update;

  if not found then
    raise exception 'Invite not found';
  end if;

  if v_invite.invited_email <> v_email then
    raise exception 'Invite email mismatch';
  end if;

  -- Create/update membership
  insert into public.workspace_members (workspace_id, user_id, role, invite_accepted, invited_email)
  values (v_invite.workspace_id, v_user_id, v_invite.role, true, null)
  on conflict (workspace_id, user_id)
  do update set
    role = excluded.role,
    invite_accepted = true,
    invited_email = null;

  update public.workspace_invites
  set accepted_at = now(),
      accepted_by = v_user_id
  where id = invite_id;

  return v_invite.workspace_id;
end;
$$;

create or replace function public.decline_workspace_invite(invite_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid;
  v_email text;
  v_count int;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception 'Not authenticated';
  end if;

  v_email := lower(auth.jwt() ->> 'email');
  if v_email is null then
    raise exception 'Email not available';
  end if;

  delete from public.workspace_invites
  where id = invite_id
    and accepted_at is null
    and invited_email = v_email;

  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

grant execute on function public.accept_workspace_invite(uuid) to authenticated;
grant execute on function public.decline_workspace_invite(uuid) to authenticated;

-- 3) Fix the existing workspace_members INSERT policy to avoid recursion and keep it valid for real members
--    (e.g. workspace owner auto-added as member on workspace creation)
drop policy if exists "Workspace owners and admins can add members" on public.workspace_members;
create policy "Workspace owners and admins can add members"
on public.workspace_members
for insert
with check (
  exists (
    select 1
    from public.workspaces w
    where w.id = workspace_id
      and w.owner_id = auth.uid()
  )
  or public.get_workspace_role(auth.uid(), workspace_id) in ('owner'::workspace_role, 'admin'::workspace_role)
);
