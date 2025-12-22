import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Plus, LogOut, Edit, Globe, EyeOff, ExternalLink, Trash2 } from "lucide-react";
import type { User } from "@supabase/supabase-js";

interface Portfolio {
  id: string;
  username: string;
  role: string;
  status: string;
  hero_title: string | null;
  created_at: string;
  updated_at: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    if (user) {
      fetchPortfolios();
    }
  }, [user]);

  const fetchPortfolios = async () => {
    const { data, error } = await supabase
      .from("portfolios")
      .select("id, username, role, status, hero_title, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setPortfolios(data);
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

  if (loading) {
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl font-bold mb-2">Your Portfolios</h1>
            <p className="text-muted-foreground">Manage and edit your portfolio websites</p>
          </div>
          <Button variant="hero" asChild>
            <Link to="/create">
              <Plus className="w-4 h-4 mr-2" />
              Create Portfolio
            </Link>
          </Button>
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
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{roleLabels[portfolio.role] || portfolio.role}</span>
                      <span>•</span>
                      <span>/{portfolio.username}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
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
