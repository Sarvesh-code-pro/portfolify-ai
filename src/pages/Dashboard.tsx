import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Sparkles, Plus, LogOut, Edit, Globe, EyeOff, ExternalLink, Trash2, BarChart3, Eye, Users, AlertCircle, FileText } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Portfolio {
  id: string;
  username: string;
  role: string;
  status: string;
  hero_title: string | null;
  created_at: string;
  updated_at: string;
  quality_score: number | null;
  workspace_id: string | null;
}

interface Workspace {
  id: string;
  name: string;
}

interface AnalyticsSummary {
  portfolio_id: string;
  total_views: number;
}

export default function Dashboard() {
  const { user, isEmailVerified, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [analytics, setAnalytics] = useState<Record<string, number>>({});
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPortfolios();
      fetchWorkspaces();
    }
  }, [user]);

  const fetchPortfolios = async () => {
    const { data, error } = await supabase
      .from("portfolios")
      .select("id, username, role, status, hero_title, created_at, updated_at, quality_score, workspace_id")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPortfolios(data);
      
      // Fetch analytics summary for each portfolio
      const analyticsMap: Record<string, number> = {};
      for (const p of data) {
        const { data: analyticsData } = await supabase
          .from("portfolio_analytics")
          .select("view_count")
          .eq("portfolio_id", p.id);
        
        if (analyticsData) {
          analyticsMap[p.id] = analyticsData.reduce((sum, row) => sum + row.view_count, 0);
        }
      }
      setAnalytics(analyticsMap);
    }
    setLoading(false);
  };

  const fetchWorkspaces = async () => {
    const { data } = await supabase
      .from("workspaces")
      .select("id, name")
      .order("name");
    
    if (data) {
      setWorkspaces(data);
    }
  };

  const handleAssignWorkspace = async (portfolioId: string, workspaceId: string | null) => {
    const { error } = await supabase
      .from("portfolios")
      .update({ workspace_id: workspaceId === "none" ? null : workspaceId })
      .eq("id", portfolioId);

    if (error) {
      toast({ title: "Failed to assign workspace", variant: "destructive" });
    } else {
      toast({ title: "Workspace assigned" });
      fetchPortfolios();
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this portfolio?")) return;
    
    const { error } = await supabase.from("portfolios").delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } else {
      toast({ title: "Portfolio deleted" });
      fetchPortfolios();
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }


  const roleLabels: Record<string, string> = {
    developer: "Developer",
    designer: "Designer",
    product_manager: "Product Manager"
  };

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
        {/* Email verification warning */}
        {!isEmailVerified && (
          <div className="mb-6 p-4 rounded-xl bg-warning/10 border border-warning/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-warning">Email not verified</p>
              <p className="text-sm text-muted-foreground">
                Please verify your email to publish portfolios. Check your inbox for the verification link.
              </p>
            </div>
          </div>
        )}

        {/* Onboarding warning */}
        {!profile?.onboarding_completed && (
          <div className="mb-6 p-4 rounded-xl bg-primary/10 border border-primary/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-primary">Complete your profile</p>
              <p className="text-sm text-muted-foreground">
                Finish the onboarding process to unlock publishing.{" "}
                <Link to="/onboarding" className="underline hover:text-primary">
                  Continue onboarding
                </Link>
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Your Portfolios</h1>
            <p className="text-muted-foreground">Manage and edit your portfolio websites</p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" asChild>
              <Link to="/resumes">
                <FileText className="w-4 h-4 mr-2" />
                Resumes
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link to="/workspaces">
                <Users className="w-4 h-4 mr-2" />
                Workspaces
              </Link>
            </Button>
            <Button variant="hero" asChild>
              <Link to="/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Portfolio
              </Link>
            </Button>
          </div>
        </div>

        {portfolios.length === 0 ? (
          /* Empty state */
          <div className="max-w-md mx-auto text-center py-16">
            <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-10 h-10 text-primary" />
            </div>
            <h2 className="font-display text-2xl font-semibold mb-3">No portfolios yet</h2>
            <p className="text-muted-foreground mb-6">
              Create your first portfolio and start showcasing your work to the world.
            </p>
            <Button variant="gradient" size="lg" asChild>
              <Link to="/create">
                <Plus className="w-4 h-4 mr-2" />
                Create Your First Portfolio
              </Link>
            </Button>
          </div>
        ) : (
          /* Portfolio list */
          <div className="grid gap-4">
            {portfolios.map((portfolio) => (
              <div 
                key={portfolio.id}
                className="p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-display text-xl font-semibold">
                        {portfolio.hero_title || portfolio.username}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        portfolio.status === "published" 
                          ? "bg-success/20 text-success" 
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {portfolio.status === "published" ? "Live" : "Draft"}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                      <span>{roleLabels[portfolio.role] || portfolio.role}</span>
                      <span>•</span>
                      <span>/{portfolio.username}</span>
                      {portfolio.quality_score !== null && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            Score: {portfolio.quality_score}/100
                          </span>
                        </>
                      )}
                      {analytics[portfolio.id] > 0 && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {analytics[portfolio.id]} views
                          </span>
                        </>
                      )}
                      {portfolio.workspace_id && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" />
                            {workspaces.find(w => w.id === portfolio.workspace_id)?.name || "Workspace"}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Workspace assignment */}
                    {workspaces.length > 0 && (
                      <Select
                        value={portfolio.workspace_id || "none"}
                        onValueChange={(value) => handleAssignWorkspace(portfolio.id, value)}
                      >
                        <SelectTrigger className="w-[140px] h-8 text-xs">
                          <SelectValue placeholder="Workspace" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No workspace</SelectItem>
                          {workspaces.map((ws) => (
                            <SelectItem key={ws.id} value={ws.id}>
                              {ws.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                    {portfolio.status === "published" && (
                      <Button variant="ghost" size="sm" asChild>
                        <a href={`/p/${portfolio.username}`} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          View
                        </a>
                      </Button>
                    )}
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/editor/${portfolio.id}`}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Link>
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleDelete(portfolio.id)}>
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
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
