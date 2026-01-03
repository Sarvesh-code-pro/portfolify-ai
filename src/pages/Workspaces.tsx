import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  ArrowLeft,
  Plus,
  Users,
  Settings,
  Trash2,
  UserPlus,
  Loader2,
  Crown,
  Edit,
  Eye,
  Check,
  X,
  Mail,
} from "lucide-react";

interface Workspace {
  id: string;
  name: string;
  description: string | null;
  owner_id: string;
  created_at: string;
}

interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: string;
  invited_email: string | null;
  invite_accepted: boolean;
}

interface PendingInvite {
  id: string;
  workspace_id: string;
  workspace_name: string;
  role: string;
}

export default function Workspaces() {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [newWorkspaceDescription, setNewWorkspaceDescription] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedWorkspace, setSelectedWorkspace] = useState<Workspace | null>(null);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<string>("viewer");
  const [inviting, setInviting] = useState(false);
  const [acceptingInvite, setAcceptingInvite] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchWorkspaces();
      fetchPendingInvites();
    }
  }, [user]);

  const fetchWorkspaces = async () => {
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setWorkspaces(data);
    }
    setLoading(false);
  };

  const fetchPendingInvites = async () => {
    if (!user?.email) return;

    // Fetch invites by email (for invites sent before user signed up)
    const { data: emailInvites } = await supabase
      .from("workspace_members")
      .select("id, workspace_id, role, invited_email")
      .eq("invited_email", user.email)
      .eq("invite_accepted", false);

    // Also fetch by user_id (for invites after user exists)
    const { data: userInvites } = await supabase
      .from("workspace_members")
      .select("id, workspace_id, role, invited_email")
      .eq("user_id", user.id)
      .eq("invite_accepted", false);

    const allInvites = [...(emailInvites || []), ...(userInvites || [])];
    
    // Deduplicate and fetch workspace names
    const uniqueInvites = allInvites.filter((inv, idx, arr) => 
      arr.findIndex(i => i.id === inv.id) === idx
    );

    if (uniqueInvites.length > 0) {
      const workspaceIds = uniqueInvites.map(i => i.workspace_id);
      const { data: workspacesData } = await supabase
        .from("workspaces")
        .select("id, name")
        .in("id", workspaceIds);

      const invitesWithNames = uniqueInvites.map(inv => ({
        id: inv.id,
        workspace_id: inv.workspace_id,
        workspace_name: workspacesData?.find(w => w.id === inv.workspace_id)?.name || "Unknown Workspace",
        role: inv.role
      }));

      setPendingInvites(invitesWithNames);
    }
  };

  const fetchMembers = async (workspaceId: string) => {
    const { data } = await supabase
      .from("workspace_members")
      .select("*")
      .eq("workspace_id", workspaceId);

    if (data) {
      setMembers(data);
    }
  };

  const handleCreateWorkspace = async () => {
    if (!user || !newWorkspaceName.trim()) return;
    setCreating(true);

    try {
      const { data: workspace, error } = await supabase
        .from("workspaces")
        .insert({
          name: newWorkspaceName,
          description: newWorkspaceDescription || null,
          owner_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      // Add owner as a member
      await supabase.from("workspace_members").insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: "owner",
        invite_accepted: true,
      });

      toast({ title: "Workspace created!" });
      setNewWorkspaceName("");
      setNewWorkspaceDescription("");
      setCreateDialogOpen(false);
      fetchWorkspaces();
    } catch (error) {
      console.error("Error creating workspace:", error);
      toast({ title: "Failed to create workspace", variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleInviteMember = async () => {
    if (!selectedWorkspace || !inviteEmail.trim()) return;
    setInviting(true);

    try {
      // First check if this email is already a member or has a pending invite
      const { data: existingMember } = await supabase
        .from("workspace_members")
        .select("id")
        .eq("workspace_id", selectedWorkspace.id)
        .eq("invited_email", inviteEmail.trim())
        .maybeSingle();

      if (existingMember) {
        toast({ title: "This email already has an invitation", variant: "destructive" });
        setInviting(false);
        return;
      }

      // Check if user exists by looking up their profile
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id")
        .limit(100);

      // We need to check auth.users by email - we'll use a workaround
      // For now, we'll create the invite with just the email and the user can claim it
      const insertData: Record<string, unknown> = {
        workspace_id: selectedWorkspace.id,
        role: inviteRole as "owner" | "admin" | "editor" | "viewer",
        invited_email: inviteEmail.trim().toLowerCase(),
        invite_accepted: false,
        user_id: user!.id, // Placeholder - will be updated when invite is accepted
      };

      const { error } = await supabase.from("workspace_members").insert(insertData as never);

      if (error) throw error;

      toast({ 
        title: "Invitation sent!",
        description: `An invitation has been sent to ${inviteEmail}. They can accept it once they sign up or log in.`
      });
      setInviteEmail("");
      fetchMembers(selectedWorkspace.id);
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({ title: "Failed to send invitation", variant: "destructive" });
    } finally {
      setInviting(false);
    }
  };

  const handleAcceptInvite = async (inviteId: string) => {
    if (!user) return;
    setAcceptingInvite(inviteId);

    try {
      const { error } = await supabase
        .from("workspace_members")
        .update({
          invite_accepted: true,
          user_id: user.id, // Update to the actual user's ID
        })
        .eq("id", inviteId);

      if (error) throw error;

      toast({ title: "Invitation accepted!" });
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
      fetchWorkspaces();
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast({ title: "Failed to accept invitation", variant: "destructive" });
    } finally {
      setAcceptingInvite(null);
    }
  };

  const handleDeclineInvite = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;

      toast({ title: "Invitation declined" });
      setPendingInvites(prev => prev.filter(i => i.id !== inviteId));
    } catch (error) {
      console.error("Error declining invite:", error);
      toast({ title: "Failed to decline invitation", variant: "destructive" });
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!confirm("Are you sure you want to remove this member?")) return;

    try {
      const { error } = await supabase
        .from("workspace_members")
        .delete()
        .eq("id", memberId);

      if (error) throw error;

      toast({ title: "Member removed" });
      if (selectedWorkspace) {
        fetchMembers(selectedWorkspace.id);
      }
    } catch (error) {
      console.error("Error removing member:", error);
      toast({ title: "Failed to remove member", variant: "destructive" });
    }
  };

  const handleDeleteWorkspace = async (workspaceId: string) => {
    if (!confirm("Are you sure you want to delete this workspace?")) return;

    const { error } = await supabase
      .from("workspaces")
      .delete()
      .eq("id", workspaceId);

    if (error) {
      toast({ title: "Failed to delete workspace", variant: "destructive" });
    } else {
      toast({ title: "Workspace deleted" });
      fetchWorkspaces();
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "owner":
        return <Crown className="w-4 h-4 text-warning" />;
      case "admin":
        return <Settings className="w-4 h-4 text-primary" />;
      case "editor":
        return <Edit className="w-4 h-4 text-muted-foreground" />;
      default:
        return <Eye className="w-4 h-4 text-muted-foreground" />;
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl">Portfolify</span>
          </Link>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Link>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Workspaces</h1>
            <p className="text-muted-foreground">
              Collaborate with your team on portfolio projects
            </p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero">
                <Plus className="w-4 h-4 mr-2" />
                Create Workspace
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Workspace</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    value={newWorkspaceName}
                    onChange={(e) => setNewWorkspaceName(e.target.value)}
                    placeholder="My Team"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    value={newWorkspaceDescription}
                    onChange={(e) => setNewWorkspaceDescription(e.target.value)}
                    placeholder="What's this workspace for?"
                  />
                </div>
                <Button
                  onClick={handleCreateWorkspace}
                  disabled={creating || !newWorkspaceName.trim()}
                  className="w-full"
                >
                  {creating && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  Create Workspace
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Pending Invitations */}
        {pendingInvites.length > 0 && (
          <div className="mb-8">
            <h2 className="font-display text-lg font-semibold mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-primary" />
              Pending Invitations
            </h2>
            <div className="grid gap-3">
              {pendingInvites.map((invite) => (
                <div
                  key={invite.id}
                  className="p-4 rounded-xl bg-primary/5 border border-primary/20 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{invite.workspace_name}</p>
                      <p className="text-sm text-muted-foreground">
                        Invited as {invite.role}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDeclineInvite(invite.id)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleAcceptInvite(invite.id)}
                      disabled={acceptingInvite === invite.id}
                    >
                      {acceptingInvite === invite.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Check className="w-4 h-4 mr-1" />
                      )}
                      Accept
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {workspaces.length === 0 ? (
          <div className="p-12 rounded-2xl bg-card border border-border/50 text-center">
            <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="font-display text-xl font-semibold mb-2">
              No workspaces yet
            </h2>
            <p className="text-muted-foreground mb-4">
              Create a workspace to collaborate with your team
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {workspaces.map((workspace) => (
              <div
                key={workspace.id}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-display text-lg font-semibold">
                          {workspace.name}
                        </h3>
                        {workspace.description && (
                          <p className="text-sm text-muted-foreground">
                            {workspace.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedWorkspace(workspace);
                            fetchMembers(workspace.id);
                          }}
                        >
                          <UserPlus className="w-4 h-4 mr-2" />
                          Invite
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>
                            Invite to {selectedWorkspace?.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Email Address</Label>
                            <Input
                              type="email"
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="email@example.com"
                            />
                            <p className="text-xs text-muted-foreground">
                              The person will receive access when they sign up or log in with this email.
                            </p>
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer - Can view portfolios</SelectItem>
                                <SelectItem value="editor">Editor - Can edit portfolios</SelectItem>
                                <SelectItem value="admin">Admin - Can manage workspace</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            onClick={handleInviteMember}
                            disabled={inviting || !inviteEmail.trim() || !inviteEmail.includes("@")}
                            className="w-full"
                          >
                            {inviting && (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            )}
                            Send Invitation
                          </Button>

                          {/* Current Members */}
                          {members.length > 0 && (
                            <div className="space-y-2 pt-4 border-t">
                              <Label>Current Members ({members.length})</Label>
                              <div className="space-y-2 max-h-48 overflow-y-auto">
                                {members.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                                  >
                                    <div className="flex items-center gap-2">
                                      {getRoleIcon(member.role)}
                                      <div>
                                        <span className="text-sm font-medium">
                                          {member.invited_email || "Owner"}
                                        </span>
                                        <span className="text-xs text-muted-foreground ml-2">
                                          ({member.role})
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span
                                        className={`text-xs px-2 py-0.5 rounded-full ${
                                          member.invite_accepted
                                            ? "bg-success/20 text-success"
                                            : "bg-warning/20 text-warning"
                                        }`}
                                      >
                                        {member.invite_accepted ? "Active" : "Pending"}
                                      </span>
                                      {member.role !== "owner" && workspace.owner_id === user?.id && (
                                        <Button
                                          variant="ghost"
                                          size="sm"
                                          className="h-6 w-6 p-0"
                                          onClick={() => handleRemoveMember(member.id)}
                                        >
                                          <X className="w-3 h-3 text-destructive" />
                                        </Button>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    {workspace.owner_id === user?.id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteWorkspace(workspace.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
