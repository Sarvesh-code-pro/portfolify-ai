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

export default function Workspaces() {
  const { user, loading: authLoading } = useAuth();
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
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
      // Check if user exists
      const { data: existingUser } = await supabase
        .from("profiles")
        .select("user_id")
        .eq("username", inviteEmail.includes("@") ? undefined : inviteEmail)
        .single();

      const insertData: Record<string, unknown> = {
        workspace_id: selectedWorkspace.id,
        role: inviteRole as "owner" | "admin" | "editor" | "viewer",
        invited_email: inviteEmail,
        invite_accepted: false,
      };
      
      if (existingUser?.user_id) {
        insertData.user_id = existingUser.user_id;
      }

      const { error } = await supabase.from("workspace_members").insert(insertData as never);

      if (error) throw error;

      toast({ title: "Invitation sent!" });
      setInviteEmail("");
      fetchMembers(selectedWorkspace.id);
    } catch (error) {
      console.error("Error inviting member:", error);
      toast({ title: "Failed to send invitation", variant: "destructive" });
    } finally {
      setInviting(false);
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
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>
                            Invite to {selectedWorkspace?.name}
                          </DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Email or Username</Label>
                            <Input
                              value={inviteEmail}
                              onChange={(e) => setInviteEmail(e.target.value)}
                              placeholder="email@example.com"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Role</Label>
                            <Select value={inviteRole} onValueChange={setInviteRole}>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="viewer">Viewer</SelectItem>
                                <SelectItem value="editor">Editor</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Current Members */}
                          {members.length > 0 && (
                            <div className="space-y-2">
                              <Label>Current Members</Label>
                              <div className="space-y-2">
                                {members.map((member) => (
                                  <div
                                    key={member.id}
                                    className="flex items-center justify-between p-2 rounded-lg bg-secondary/50"
                                  >
                                    <div className="flex items-center gap-2">
                                      {getRoleIcon(member.role)}
                                      <span className="text-sm">
                                        {member.invited_email || "User"}
                                      </span>
                                    </div>
                                    <span
                                      className={`text-xs px-2 py-0.5 rounded-full ${
                                        member.invite_accepted
                                          ? "bg-success/20 text-success"
                                          : "bg-warning/20 text-warning"
                                      }`}
                                    >
                                      {member.invite_accepted ? "Active" : "Pending"}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <Button
                            onClick={handleInviteMember}
                            disabled={inviting || !inviteEmail.trim()}
                            className="w-full"
                          >
                            {inviting && (
                              <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            )}
                            Send Invitation
                          </Button>
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
