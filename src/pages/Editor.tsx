import { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { 
  ArrowLeft, Save, Globe, Eye, EyeOff, Loader2, Plus, Trash2, 
  GripVertical, ExternalLink, Settings, Palette, BarChart3, FileText, GitBranch, Star, Link as LinkIcon, Camera
} from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { PortfolioPreview } from "@/components/editor/PortfolioPreview";
import { ResumeSync } from "@/components/editor/ResumeSync";
import { QualityScore } from "@/components/editor/QualityScore";
import { PortfolioAnalytics } from "@/components/editor/PortfolioAnalytics";
import { VersionManager } from "@/components/editor/VersionManager";
import { ABTestManager } from "@/components/editor/ABTestManager";
import { AICommandInput } from "@/components/editor/AICommandInput";
import { PublicLinksManager } from "@/components/editor/PublicLinksManager";
import { ProfilePictureEditor } from "@/components/editor/ProfilePictureEditor";
import { getClientErrorMessage } from "@/lib/error-utils";
interface Project {
  title: string;
  description: string;
  technologies: string[];
  link: string;
}

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

interface Portfolio {
  id: string;
  username: string;
  role: string;
  status: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  skills: string[];
  projects: Project[];
  experience: Experience[];
  education: any[];
  links: { github?: string; linkedin?: string; website?: string };
  template: string;
  theme: { primaryColor: string; backgroundColor: string; textColor: string };
  resume_text: string | null;
  quality_score: number | null;
  profile_picture_url: string | null;
}

export default function Editor() {
  const { id } = useParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [activeTab, setActiveTab] = useState<"content" | "style" | "tools">("content");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    
    const fetchPortfolio = async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error || !data) {
        toast({ title: "Portfolio not found", variant: "destructive" });
        navigate("/dashboard");
        return;
      }

      setPortfolio({
        ...data,
        skills: Array.isArray(data.skills) ? data.skills as string[] : [],
        projects: Array.isArray(data.projects) ? data.projects as unknown as Project[] : [],
        experience: Array.isArray(data.experience) ? data.experience as unknown as Experience[] : [],
        education: Array.isArray(data.education) ? data.education as any[] : [],
        links: data.links as Portfolio["links"] || {},
        theme: data.theme as Portfolio["theme"] || { primaryColor: "#3B82F6", backgroundColor: "#0F172A", textColor: "#F8FAFC" },
        resume_text: data.resume_text || null,
        quality_score: data.quality_score || null,
        profile_picture_url: data.profile_picture_url || null
      });
      setLoading(false);
    };

    fetchPortfolio();
  }, [user, id, navigate, toast]);

  const handleSave = async () => {
    if (!portfolio) return;
    setSaving(true);
    
    try {
      const { error } = await supabase
        .from("portfolios")
        .update({
          hero_title: portfolio.hero_title,
          hero_subtitle: portfolio.hero_subtitle,
          about_text: portfolio.about_text,
          skills: portfolio.skills,
          projects: JSON.parse(JSON.stringify(portfolio.projects)),
          experience: JSON.parse(JSON.stringify(portfolio.experience)),
          links: portfolio.links,
          template: portfolio.template,
          theme: portfolio.theme,
          profile_picture_url: portfolio.profile_picture_url
        })
        .eq("id", portfolio.id);

      if (error) throw error;
      toast({ title: "Saved successfully!" });
    } catch (error: unknown) {
      toast({ title: "Save failed", description: getClientErrorMessage(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!portfolio) return;
    
    // Check email verification before publishing
    const { data: { user: currentUser } } = await supabase.auth.getUser();
    if (!currentUser?.email_confirmed_at && portfolio.status !== "published") {
      toast({ 
        title: "Email verification required", 
        description: "Please verify your email before publishing your portfolio.",
        variant: "destructive" 
      });
      return;
    }

    // Check onboarding completion
    const { data: profile } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("user_id", currentUser?.id)
      .single();

    if (!profile?.onboarding_completed && portfolio.status !== "published") {
      toast({ 
        title: "Complete onboarding first", 
        description: "Please complete the onboarding process before publishing.",
        variant: "destructive" 
      });
      return;
    }

    setPublishing(true);
    
    try {
      const newStatus = portfolio.status === "published" ? "unpublished" : "published";
      const { error } = await supabase
        .from("portfolios")
        .update({ 
          status: newStatus,
          published_at: newStatus === "published" ? new Date().toISOString() : null
        })
        .eq("id", portfolio.id);

      if (error) throw error;
      
      setPortfolio({ ...portfolio, status: newStatus });
      toast({ 
        title: newStatus === "published" ? "Portfolio published!" : "Portfolio unpublished",
        description: newStatus === "published" ? `Live at /${portfolio.username}` : undefined
      });
    } catch (error: unknown) {
      toast({ title: "Action failed", description: getClientErrorMessage(error), variant: "destructive" });
    } finally {
      setPublishing(false);
    }
  };

  const updatePortfolio = (updates: Partial<Portfolio>) => {
    if (portfolio) {
      setPortfolio({ ...portfolio, ...updates });
    }
  };

  const addProject = () => {
    if (portfolio) {
      setPortfolio({
        ...portfolio,
        projects: [...portfolio.projects, { title: "", description: "", technologies: [], link: "" }]
      });
    }
  };

  const removeProject = (index: number) => {
    if (portfolio) {
      setPortfolio({
        ...portfolio,
        projects: portfolio.projects.filter((_, i) => i !== index)
      });
    }
  };

  const updateProject = (index: number, updates: Partial<Project>) => {
    if (portfolio) {
      const newProjects = [...portfolio.projects];
      newProjects[index] = { ...newProjects[index], ...updates };
      setPortfolio({ ...portfolio, projects: newProjects });
    }
  };

  if (loading || !portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Dashboard
            </Link>
          </Button>
          <div className="h-6 w-px bg-border" />
          <span className="text-sm text-muted-foreground">{portfolio.username}</span>
          {portfolio.status === "published" && (
            <a 
              href={`/p/${portfolio.username}`} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-primary hover:underline flex items-center gap-1"
            >
              View live <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
            Save
          </Button>
          <Button 
            variant={portfolio.status === "published" ? "outline" : "hero"} 
            size="sm" 
            onClick={handlePublish}
            disabled={publishing}
          >
            {publishing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : portfolio.status === "published" ? (
              <>
                <EyeOff className="w-4 h-4 mr-2" />
                Unpublish
              </>
            ) : (
              <>
                <Globe className="w-4 h-4 mr-2" />
                Publish
              </>
            )}
          </Button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Editor panel */}
        <div className="w-[480px] border-r border-border/50 flex flex-col overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border/50 p-2 gap-1">
            <button
              onClick={() => setActiveTab("content")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "content" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Settings className="w-4 h-4 inline mr-1" />
              Content
            </button>
            <button
              onClick={() => setActiveTab("style")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "style" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Palette className="w-4 h-4 inline mr-1" />
              Style
            </button>
            <button
              onClick={() => setActiveTab("tools")}
              className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                activeTab === "tools" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary"
              }`}
            >
              <Star className="w-4 h-4 inline mr-1" />
              Tools
            </button>
          </div>

          {/* Editor content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
            {activeTab === "content" && (
              <>
                {/* Profile Picture Section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Profile Picture</h3>
                  <div className="flex items-center gap-4">
                    <div className="w-20 h-20 rounded-full overflow-hidden bg-secondary border-2 border-border flex items-center justify-center">
                      {portfolio.profile_picture_url ? (
                        <img 
                          src={portfolio.profile_picture_url} 
                          alt="Profile" 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <Camera className="w-8 h-8 text-muted-foreground" />
                      )}
                    </div>
                    {user && (
                      <ProfilePictureEditor
                        userId={user.id}
                        currentUrl={portfolio.profile_picture_url}
                        onUpdate={(url) => updatePortfolio({ profile_picture_url: url })}
                      />
                    )}
                  </div>
                </div>

                {/* Hero section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Hero</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={portfolio.hero_title || ""}
                        onChange={(e) => updatePortfolio({ hero_title: e.target.value })}
                        placeholder="Your Name - Title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Subtitle</Label>
                      <Input
                        value={portfolio.hero_subtitle || ""}
                        onChange={(e) => updatePortfolio({ hero_subtitle: e.target.value })}
                        placeholder="Brief tagline"
                      />
                    </div>
                  </div>
                </div>

                {/* About section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">About</h3>
                  <Textarea
                    value={portfolio.about_text || ""}
                    onChange={(e) => updatePortfolio({ about_text: e.target.value })}
                    placeholder="Tell your story..."
                    className="min-h-[150px]"
                  />
                </div>

                {/* Skills section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Skills</h3>
                  <Input
                    value={portfolio.skills.join(", ")}
                    onChange={(e) => updatePortfolio({ skills: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                    placeholder="React, TypeScript, Node.js..."
                  />
                </div>

                {/* Projects section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Projects</h3>
                    <Button variant="ghost" size="sm" onClick={addProject}>
                      <Plus className="w-4 h-4 mr-1" /> Add
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {portfolio.projects.map((project, index) => (
                      <div key={index} className="p-4 rounded-lg bg-secondary/30 border border-border/50 space-y-3">
                        <div className="flex items-start justify-between">
                          <GripVertical className="w-4 h-4 text-muted-foreground mt-2" />
                          <Button variant="ghost" size="sm" onClick={() => removeProject(index)}>
                            <Trash2 className="w-4 h-4 text-destructive" />
                          </Button>
                        </div>
                        <Input
                          value={project.title}
                          onChange={(e) => updateProject(index, { title: e.target.value })}
                          placeholder="Project name"
                        />
                        <Textarea
                          value={project.description}
                          onChange={(e) => updateProject(index, { description: e.target.value })}
                          placeholder="What does it do?"
                          className="min-h-[80px]"
                        />
                        <Input
                          value={project.technologies.join(", ")}
                          onChange={(e) => updateProject(index, { technologies: e.target.value.split(",").map(s => s.trim()).filter(Boolean) })}
                          placeholder="Technologies used"
                        />
                        <Input
                          value={project.link}
                          onChange={(e) => updateProject(index, { link: e.target.value })}
                          placeholder="Project URL"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Links section */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Links</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label>GitHub</Label>
                      <Input
                        value={portfolio.links.github || ""}
                        onChange={(e) => updatePortfolio({ links: { ...portfolio.links, github: e.target.value } })}
                        placeholder="github.com/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>LinkedIn</Label>
                      <Input
                        value={portfolio.links.linkedin || ""}
                        onChange={(e) => updatePortfolio({ links: { ...portfolio.links, linkedin: e.target.value } })}
                        placeholder="linkedin.com/in/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Website</Label>
                      <Input
                        value={portfolio.links.website || ""}
                        onChange={(e) => updatePortfolio({ links: { ...portfolio.links, website: e.target.value } })}
                        placeholder="yourwebsite.com"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "style" && (
              <>
                {/* Template selection */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Template</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: "minimal", name: "Minimal", desc: "Clean & simple" },
                      { id: "bold", name: "Bold", desc: "Strong impact" },
                      { id: "elegant", name: "Elegant", desc: "Sophisticated" },
                      { id: "creative", name: "Creative", desc: "Artsy & unique" },
                      { id: "modern", name: "Modern", desc: "Contemporary" },
                      { id: "professional", name: "Professional", desc: "Corporate" },
                    ].map((template) => (
                      <button
                        key={template.id}
                        onClick={() => updatePortfolio({ template: template.id })}
                        className={`p-4 rounded-xl border-2 transition-all text-left ${
                          portfolio.template === template.id
                            ? "border-primary bg-primary/5"
                            : "border-border hover:border-primary/30"
                        }`}
                      >
                        <div className="font-medium text-sm">{template.name}</div>
                        <div className="text-xs text-muted-foreground">{template.desc}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Color customization */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">Colors</h3>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label>Primary Color</Label>
                      <input
                        type="color"
                        value={portfolio.theme.primaryColor}
                        onChange={(e) => updatePortfolio({ theme: { ...portfolio.theme, primaryColor: e.target.value } })}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Background</Label>
                      <input
                        type="color"
                        value={portfolio.theme.backgroundColor}
                        onChange={(e) => updatePortfolio({ theme: { ...portfolio.theme, backgroundColor: e.target.value } })}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label>Text Color</Label>
                      <input
                        type="color"
                        value={portfolio.theme.textColor}
                        onChange={(e) => updatePortfolio({ theme: { ...portfolio.theme, textColor: e.target.value } })}
                        className="w-10 h-10 rounded-lg border border-border cursor-pointer"
                      />
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === "tools" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mb-2">AI Content Editor</h3>
                <AICommandInput 
                  portfolio={{
                    id: portfolio.id,
                    role: portfolio.role,
                    hero_title: portfolio.hero_title,
                    hero_subtitle: portfolio.hero_subtitle,
                    about_text: portfolio.about_text,
                    skills: portfolio.skills,
                    projects: portfolio.projects,
                    experience: portfolio.experience
                  }}
                  onUpdate={updatePortfolio}
                  onSave={handleSave}
                />

                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mt-6 mb-2">AI Tools</h3>
                <div className="flex flex-wrap gap-2">
                  <QualityScore 
                    portfolio={{
                      id: portfolio.id,
                      role: portfolio.role,
                      hero_title: portfolio.hero_title,
                      hero_subtitle: portfolio.hero_subtitle,
                      about_text: portfolio.about_text,
                      skills: portfolio.skills,
                      projects: portfolio.projects,
                      experience: portfolio.experience,
                      links: portfolio.links
                    }}
                    onScoreUpdate={(score, suggestions) => {
                      updatePortfolio({ quality_score: score } as any);
                    }}
                  />
                  <ResumeSync 
                    portfolio={{
                      id: portfolio.id,
                      role: portfolio.role,
                      hero_title: portfolio.hero_title,
                      hero_subtitle: portfolio.hero_subtitle,
                      about_text: portfolio.about_text,
                      skills: portfolio.skills,
                      projects: portfolio.projects,
                      experience: portfolio.experience,
                      education: portfolio.education,
                      links: portfolio.links
                    }}
                    currentResumeText={portfolio.resume_text}
                    onSyncComplete={(updates) => {
                      updatePortfolio(updates);
                    }}
                  />
                </div>

                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mt-6 mb-2">Version Management</h3>
                <div className="flex flex-wrap gap-2">
                  {user && (
                    <>
                      <VersionManager 
                        portfolioId={portfolio.id}
                        userId={user.id}
                        basePortfolio={{
                          id: portfolio.id,
                          username: portfolio.username,
                          role: portfolio.role,
                          hero_title: portfolio.hero_title,
                          hero_subtitle: portfolio.hero_subtitle,
                          about_text: portfolio.about_text,
                          skills: portfolio.skills,
                          projects: JSON.parse(JSON.stringify(portfolio.projects)),
                          experience: JSON.parse(JSON.stringify(portfolio.experience)),
                          education: JSON.parse(JSON.stringify(portfolio.education)),
                          links: portfolio.links,
                          template: portfolio.template,
                          theme: portfolio.theme,
                          resume_text: portfolio.resume_text
                        }}
                      />
                      <ABTestManager 
                        portfolioId={portfolio.id}
                        userId={user.id}
                      />
                    </>
                  )}
                </div>

                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mt-6 mb-2 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4" />
                  Custom Links
                </h3>
                {user && (
                  <PublicLinksManager 
                    portfolioId={portfolio.id}
                    userId={user.id}
                    defaultSectionVisibility={{
                      hero: true,
                      about: true,
                      skills: true,
                      projects: true,
                      experience: true,
                      education: true,
                      testimonials: true,
                      contact: true
                    }}
                  />
                )}

                <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground mt-6 mb-2">Analytics</h3>
                <PortfolioAnalytics 
                  portfolioId={portfolio.id}
                  isPublished={portfolio.status === "published"}
                />
              </div>
            )}
          </div>
        </div>

        {/* Preview panel */}
        <div className="flex-1 bg-muted/30 overflow-hidden">
          <PortfolioPreview portfolio={portfolio} />
        </div>
      </div>
    </div>
  );
}
