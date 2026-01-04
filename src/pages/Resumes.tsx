import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Sparkles, Plus, LogOut, FileText, Trash2, Edit, Download, 
  Target, Copy, MoreHorizontal, ArrowLeft, Briefcase
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Resume {
  id: string;
  name: string;
  target_role: string | null;
  target_company: string | null;
  template: string;
  ats_score: number | null;
  portfolio_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Portfolio {
  id: string;
  username: string;
  hero_title: string | null;
}

export default function Resumes() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [resumes, setResumes] = useState<Resume[]>([]);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [newResumeName, setNewResumeName] = useState("");
  const [selectedPortfolio, setSelectedPortfolio] = useState<string>("");
  const [creating, setCreating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchResumes();
      fetchPortfolios();
    }
  }, [user]);

  const fetchResumes = async () => {
    const { data, error } = await supabase
      .from("resumes")
      .select("id, name, target_role, target_company, template, ats_score, portfolio_id, created_at, updated_at")
      .order("updated_at", { ascending: false });

    if (!error && data) {
      setResumes(data);
    }
    setLoading(false);
  };

  const fetchPortfolios = async () => {
    const { data } = await supabase
      .from("portfolios")
      .select("id, username, hero_title")
      .order("created_at", { ascending: false });
    
    if (data) {
      setPortfolios(data);
    }
  };

  const handleCreate = async () => {
    if (!user || !newResumeName.trim()) return;
    setCreating(true);

    try {
      const { data, error } = await supabase
        .from("resumes")
        .insert({
          user_id: user.id,
          name: newResumeName.trim(),
          portfolio_id: selectedPortfolio || null,
        })
        .select("id")
        .single();

      if (error) throw error;
      
      toast({ title: "Resume created!" });
      setCreateOpen(false);
      setNewResumeName("");
      setSelectedPortfolio("");
      navigate(`/resumes/${data.id}`);
    } catch (error: any) {
      toast({ title: "Failed to create resume", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this resume?")) return;
    
    const { error } = await supabase.from("resumes").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } else {
      toast({ title: "Resume deleted" });
      fetchResumes();
    }
  };

  const handleDuplicate = async (resume: Resume) => {
    if (!user) return;
    
    const { data, error } = await supabase
      .from("resumes")
      .insert({
        user_id: user.id,
        name: `${resume.name} (Copy)`,
        target_role: resume.target_role,
        target_company: resume.target_company,
        template: resume.template,
        portfolio_id: resume.portfolio_id,
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Duplicate failed", variant: "destructive" });
    } else {
      toast({ title: "Resume duplicated" });
      fetchResumes();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const templateLabels: Record<string, string> = {
    classic: "Classic",
    modern: "Modern",
    minimal: "Minimal",
    professional: "Professional",
    executive: "Executive",
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <FileText className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-display font-bold text-xl">Resume Creator</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">{user?.email}</span>
            <Button variant="ghost" size="sm" onClick={handleSignOut}>
              <LogOut className="w-4 h-4 sm:mr-2" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="container mx-auto px-4 py-12">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Your Resumes</h1>
            <p className="text-muted-foreground">
              Create ATS-optimized resumes from your portfolio data
            </p>
          </div>
          <Button variant="hero" onClick={() => setCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Resume
          </Button>
        </div>

        {/* Info banner */}
        <div className="mb-8 p-4 rounded-xl bg-primary/5 border border-primary/20">
          <div className="flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm">Portfolio-Powered Resumes</p>
              <p className="text-sm text-muted-foreground">
                Resumes are generated from your portfolio data. Update your portfolio once, and all linked resumes stay in sync.
              </p>
            </div>
          </div>
        </div>

        {resumes.length === 0 ? (
          /* Empty state */
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <FileText className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-3">No resumes yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first ATS-optimized resume from your portfolio data.
            </p>
            <Button variant="gradient" size="lg" onClick={() => setCreateOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Your First Resume
            </Button>
          </div>
        ) : (
          /* Resume list */
          <div className="grid gap-4">
            {resumes.map((resume) => (
              <div 
                key={resume.id}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <h3 className="font-display text-xl font-semibold">
                        {resume.name}
                      </h3>
                      {resume.ats_score && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          resume.ats_score >= 80 
                            ? "bg-success/20 text-success" 
                            : resume.ats_score >= 60
                            ? "bg-warning/20 text-warning"
                            : "bg-destructive/20 text-destructive"
                        }`}>
                          ATS: {resume.ats_score}%
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span>{templateLabels[resume.template] || resume.template}</span>
                      {resume.target_role && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Target className="w-3 h-3" />
                            {resume.target_role}
                          </span>
                        </>
                      )}
                      {resume.target_company && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Briefcase className="w-3 h-3" />
                            {resume.target_company}
                          </span>
                        </>
                      )}
                      <span>•</span>
                      <span>Updated {new Date(resume.updated_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/resumes/${resume.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleDuplicate(resume)}>
                          <Copy className="w-4 h-4 mr-2" />
                          Duplicate
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-destructive"
                          onClick={() => handleDelete(resume.id)}
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Resume Dialog */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Resume</DialogTitle>
            <DialogDescription>
              Create a new resume from your portfolio data. You can customize it after creation.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Resume Name</Label>
              <Input
                id="name"
                value={newResumeName}
                onChange={(e) => setNewResumeName(e.target.value)}
                placeholder="e.g., Software Engineer Resume"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="portfolio">Source Portfolio (Optional)</Label>
              <Select value={selectedPortfolio} onValueChange={setSelectedPortfolio}>
                <SelectTrigger id="portfolio">
                  <SelectValue placeholder="Select a portfolio" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No portfolio</SelectItem>
                  {portfolios.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.hero_title || p.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Link to a portfolio to automatically pull experience, skills, and projects.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button onClick={handleCreate} disabled={creating || !newResumeName.trim()}>
              {creating ? "Creating..." : "Create Resume"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
