import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, FileText, MessageSquare } from "lucide-react";
import type { User } from "@supabase/supabase-js";

type InputMode = "form" | "prompt";

export default function PortfolioDetails() {
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role") as "developer" | "designer" | "product_manager";
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [inputMode, setInputMode] = useState<InputMode>("form");
  const navigate = useNavigate();
  const { toast } = useToast();

  // Form state
  const [formData, setFormData] = useState({
    fullName: "",
    title: "",
    about: "",
    skills: "",
    projects: "",
    links: {
      github: "",
      linkedin: "",
      website: ""
    }
  });

  // Prompt state
  const [prompt, setPrompt] = useState("");

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
    if (!loading && !role) {
      navigate("/create");
    }
  }, [user, loading, navigate, role]);

  const handleGenerate = async () => {
    if (!user) return;
    
    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("generate-portfolio", {
        body: {
          role,
          mode: inputMode,
          formData: inputMode === "form" ? formData : null,
          prompt: inputMode === "prompt" ? prompt : null
        }
      });

      if (response.error) throw new Error(response.error.message);

      const portfolioData = response.data;
      
      // Generate unique username
      const username = formData.fullName
        ? formData.fullName.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36)
        : "portfolio-" + Date.now().toString(36);

      // Create portfolio in database
      const { data: portfolio, error } = await supabase
        .from("portfolios")
        .insert({
          user_id: user.id,
          username,
          role,
          hero_title: portfolioData.heroTitle,
          hero_subtitle: portfolioData.heroSubtitle,
          about_text: portfolioData.about,
          skills: portfolioData.skills,
          projects: portfolioData.projects,
          experience: portfolioData.experience || [],
          links: {
            github: formData.links.github || portfolioData.links?.github || "",
            linkedin: formData.links.linkedin || portfolioData.links?.linkedin || "",
            website: formData.links.website || portfolioData.links?.website || ""
          },
          template: "minimal",
          status: "draft"
        })
        .select()
        .single();

      if (error) throw error;

      toast({ title: "Portfolio generated!", description: "Now customize it in the editor." });
      navigate(`/editor/${portfolio.id}`);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({ 
        title: "Generation failed", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabel = role === "product_manager" ? "Product Manager" : role?.charAt(0).toUpperCase() + role?.slice(1);

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(217_91%_60%/0.1)_0%,transparent_50%)]" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Link to="/create" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to role selection
        </Link>

        <div className="max-w-3xl mx-auto">
          {/* Progress */}
          <div className="flex items-center gap-2 mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">✓</div>
              <span className="text-sm text-muted-foreground">{roleLabel}</span>
            </div>
            <div className="flex-1 h-px bg-primary/50" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">2</div>
              <span className="text-sm font-medium">Add Details</span>
            </div>
            <div className="flex-1 h-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground font-semibold text-sm">3</div>
              <span className="text-sm text-muted-foreground">Generate</span>
            </div>
          </div>

          <div className="text-center mb-8">
            <h1 className="font-display text-4xl font-bold mb-3">Add your details</h1>
            <p className="text-lg text-muted-foreground">
              Choose how you want to provide your information
            </p>
          </div>

          {/* Mode selector */}
          <div className="flex gap-4 mb-8">
            <button
              onClick={() => setInputMode("form")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                inputMode === "form" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/30"
              }`}
            >
              <FileText className={`w-6 h-6 mx-auto mb-2 ${inputMode === "form" ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium">Guided Form</p>
              <p className="text-sm text-muted-foreground">Step by step</p>
            </button>
            <button
              onClick={() => setInputMode("prompt")}
              className={`flex-1 p-4 rounded-xl border-2 transition-all ${
                inputMode === "prompt" 
                  ? "border-primary bg-primary/5" 
                  : "border-border hover:border-primary/30"
              }`}
            >
              <MessageSquare className={`w-6 h-6 mx-auto mb-2 ${inputMode === "prompt" ? "text-primary" : "text-muted-foreground"}`} />
              <p className="font-medium">Single Prompt</p>
              <p className="text-sm text-muted-foreground">Describe everything</p>
            </button>
          </div>

          {/* Form mode */}
          {inputMode === "form" && (
            <div className="space-y-6 bg-card p-8 rounded-2xl border border-border/50">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <Input
                    id="fullName"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="title">Professional Title</Label>
                  <Input
                    id="title"
                    placeholder={role === "developer" ? "Senior Frontend Engineer" : role === "designer" ? "Product Designer" : "Senior Product Manager"}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="about">About You (brief description)</Label>
                <Textarea
                  id="about"
                  placeholder="A brief summary of your experience and what you're passionate about..."
                  value={formData.about}
                  onChange={(e) => setFormData({ ...formData, about: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="skills">Key Skills (comma separated)</Label>
                <Input
                  id="skills"
                  placeholder={role === "developer" ? "React, TypeScript, Node.js, AWS" : role === "designer" ? "Figma, UI/UX, Design Systems, Prototyping" : "Roadmapping, Agile, User Research, Analytics"}
                  value={formData.skills}
                  onChange={(e) => setFormData({ ...formData, skills: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="projects">Notable Projects (one per line: name - description)</Label>
                <Textarea
                  id="projects"
                  placeholder={`E-commerce Platform - Built a scalable shopping experience\nMobile App - Led development of iOS/Android app`}
                  value={formData.projects}
                  onChange={(e) => setFormData({ ...formData, projects: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="github">GitHub URL</Label>
                  <Input
                    id="github"
                    placeholder="github.com/username"
                    value={formData.links.github}
                    onChange={(e) => setFormData({ ...formData, links: { ...formData.links, github: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="linkedin">LinkedIn URL</Label>
                  <Input
                    id="linkedin"
                    placeholder="linkedin.com/in/username"
                    value={formData.links.linkedin}
                    onChange={(e) => setFormData({ ...formData, links: { ...formData.links, linkedin: e.target.value } })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    placeholder="yourwebsite.com"
                    value={formData.links.website}
                    onChange={(e) => setFormData({ ...formData, links: { ...formData.links, website: e.target.value } })}
                  />
                </div>
              </div>
            </div>
          )}

          {/* Prompt mode */}
          {inputMode === "prompt" && (
            <div className="bg-card p-8 rounded-2xl border border-border/50">
              <div className="space-y-2">
                <Label htmlFor="prompt">Describe your portfolio</Label>
                <Textarea
                  id="prompt"
                  placeholder={`Example: I'm a senior ${roleLabel?.toLowerCase()} with 5 years of experience at tech companies like Google and Stripe. I specialize in ${role === "developer" ? "building scalable web applications with React and Node.js" : role === "designer" ? "creating intuitive user experiences and design systems" : "launching B2B products and leading cross-functional teams"}. I want a modern, minimal portfolio that highlights my key projects and skills. My style should be professional but friendly.`}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[200px]"
                />
                <p className="text-sm text-muted-foreground">
                  Include your experience, skills, projects, and any style preferences.
                </p>
              </div>
            </div>
          )}

          <div className="mt-10 flex justify-between">
            <Button variant="outline" asChild>
              <Link to="/create">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Link>
            </Button>
            <Button 
              variant="gradient" 
              size="lg" 
              onClick={handleGenerate}
              disabled={generating || (inputMode === "form" && !formData.fullName) || (inputMode === "prompt" && !prompt)}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate Portfolio
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
