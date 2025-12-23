import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  Copy, Plus, Trash2, Edit, Globe, EyeOff, Layers
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PortfolioVersion {
  id: string;
  username: string;
  version_name: string | null;
  version_emphasis: string | null;
  status: string;
  created_at: string;
}

interface VersionManagerProps {
  portfolioId: string;
  userId: string;
  basePortfolio: any;
  onVersionCreated?: () => void;
}

export function VersionManager({ portfolioId, userId, basePortfolio, onVersionCreated }: VersionManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [versions, setVersions] = useState<PortfolioVersion[]>([]);
  const [creating, setCreating] = useState(false);
  const [newVersionName, setNewVersionName] = useState("");
  const [newVersionEmphasis, setNewVersionEmphasis] = useState("technical");
  const { toast } = useToast();

  const fetchVersions = async () => {
    // Fetch all versions (portfolios with parent_portfolio_id = this portfolio)
    const { data, error } = await supabase
      .from("portfolios")
      .select("id, username, version_name, version_emphasis, status, created_at")
      .eq("parent_portfolio_id", portfolioId)
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVersions(data as PortfolioVersion[]);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, portfolioId]);

  const createVersion = async () => {
    if (!newVersionName.trim()) {
      toast({ title: "Please enter a version name", variant: "destructive" });
      return;
    }

    setCreating(true);
    try {
      const username = `${basePortfolio.username}-${newVersionName.toLowerCase().replace(/\s+/g, "-")}-${Date.now().toString(36)}`;
      
      const { data, error } = await supabase
        .from("portfolios")
        .insert({
          user_id: userId,
          username,
          role: basePortfolio.role,
          hero_title: basePortfolio.hero_title,
          hero_subtitle: basePortfolio.hero_subtitle,
          about_text: basePortfolio.about_text,
          skills: basePortfolio.skills,
          projects: basePortfolio.projects,
          experience: basePortfolio.experience,
          education: basePortfolio.education,
          links: basePortfolio.links,
          template: basePortfolio.template,
          theme: basePortfolio.theme,
          status: "draft",
          parent_portfolio_id: portfolioId,
          version_name: newVersionName,
          version_emphasis: newVersionEmphasis,
          resume_text: basePortfolio.resume_text
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Version created", description: `"${newVersionName}" is ready to customize.` });
      setNewVersionName("");
      fetchVersions();
      onVersionCreated?.();
    } catch (error: any) {
      toast({ title: "Failed to create version", description: error.message, variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const deleteVersion = async (versionId: string) => {
    if (!confirm("Delete this version?")) return;

    const { error } = await supabase
      .from("portfolios")
      .delete()
      .eq("id", versionId);

    if (error) {
      toast({ title: "Delete failed", variant: "destructive" });
    } else {
      toast({ title: "Version deleted" });
      fetchVersions();
    }
  };

  const emphasisOptions = [
    { value: "technical", label: "Technical Skills", description: "Highlight coding, architecture, technical depth" },
    { value: "impact", label: "Business Impact", description: "Focus on metrics, outcomes, business value" },
    { value: "leadership", label: "Leadership", description: "Emphasize team leadership, mentoring, strategy" },
    { value: "creative", label: "Creative Work", description: "Showcase design, creativity, visual projects" }
  ];

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Layers className="w-4 h-4" />
        Versions ({versions.length})
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Layers className="w-5 h-5" />
              Portfolio Versions
            </DialogTitle>
            <DialogDescription>
              Create targeted versions for different roles or job applications.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Create new version */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-3 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Create New Version
              </h3>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Version Name</Label>
                  <Input
                    placeholder="e.g., Frontend Role, Startup Focus"
                    value={newVersionName}
                    onChange={(e) => setNewVersionName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Emphasis</Label>
                  <Select value={newVersionEmphasis} onValueChange={setNewVersionEmphasis}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {emphasisOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          <div>
                            <div className="font-medium">{option.label}</div>
                            <div className="text-xs text-muted-foreground">{option.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={createVersion} 
                  disabled={creating || !newVersionName.trim()}
                  className="w-full"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Create Version
                </Button>
              </div>
            </div>

            {/* Existing versions */}
            {versions.length > 0 && (
              <div className="space-y-3">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                  Existing Versions
                </h3>
                {versions.map((version) => (
                  <div 
                    key={version.id}
                    className="p-4 rounded-xl border border-border bg-secondary/30 flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{version.version_name || "Untitled"}</span>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${
                          version.status === "published" 
                            ? "bg-success/20 text-success" 
                            : "bg-muted text-muted-foreground"
                        }`}>
                          {version.status === "published" ? "Live" : "Draft"}
                        </span>
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {version.version_emphasis && (
                          <span className="capitalize">{version.version_emphasis} focus • </span>
                        )}
                        /{version.username}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" asChild>
                        <Link to={`/editor/${version.id}`}>
                          <Edit className="w-4 h-4" />
                        </Link>
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => deleteVersion(version.id)}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {versions.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-4">
                No versions yet. Create one to target specific roles or companies.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
