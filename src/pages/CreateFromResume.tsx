import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText, Loader2, Sparkles, X } from "lucide-react";
import type { User } from "@supabase/supabase-js";

export default function CreateFromResume() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
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

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type === "application/pdf") {
      // For PDF, we'll read it as text (simplified - in production use a proper PDF parser)
      const reader = new FileReader();
      reader.onload = (event) => {
        // For now, prompt user to paste text if PDF
        setFileName(file.name);
        toast({
          title: "PDF uploaded",
          description: "Please also paste your resume text for best results.",
        });
      };
      reader.readAsArrayBuffer(file);
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setResumeText(event.target?.result as string);
        setFileName(file.name);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or TXT file, or paste your resume text.",
        variant: "destructive",
      });
    }
  };

  const clearFile = () => {
    setFileName("");
    setResumeText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    if (!user || !resumeText.trim()) return;
    
    setGenerating(true);
    try {
      const response = await supabase.functions.invoke("parse-resume", {
        body: { resumeText }
      });

      if (response.error) throw new Error(response.error.message);

      const parsedData = response.data;
      
      if (parsedData.error) {
        throw new Error(parsedData.error);
      }

      // Generate unique username
      const name = parsedData.heroTitle?.split(" - ")[0] || "portfolio";
      const username = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);

      // Create portfolio in database
      const { data: portfolio, error } = await supabase
        .from("portfolios")
        .insert({
          user_id: user.id,
          username,
          role: parsedData.detectedRole || "developer",
          hero_title: parsedData.heroTitle,
          hero_subtitle: parsedData.heroSubtitle,
          about_text: parsedData.about,
          skills: parsedData.skills || [],
          projects: parsedData.projects || [],
          experience: parsedData.experience || [],
          education: parsedData.education || [],
          links: parsedData.extractedLinks || {},
          template: "minimal",
          status: "draft",
          resume_text: resumeText,
          resume_updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: "Portfolio created!", 
        description: `Detected role: ${parsedData.detectedRole?.replace("_", " ")}. Now customize it in the editor.` 
      });
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

  return (
    <div className="min-h-screen bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(217_91%_60%/0.1)_0%,transparent_50%)]" />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        <Link to="/create" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to creation options
        </Link>

        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <FileText className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-4xl font-bold mb-3">Create from Resume</h1>
            <p className="text-lg text-muted-foreground">
              Upload your resume or paste the text. AI will extract your information and detect your role automatically.
            </p>
          </div>

          <div className="bg-card p-8 rounded-2xl border border-border/50 space-y-6">
            {/* File upload */}
            <div>
              <Label className="text-base mb-3 block">Upload Resume (PDF or TXT)</Label>
              {fileName ? (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                  <FileText className="w-5 h-5 text-primary" />
                  <span className="flex-1 truncate">{fileName}</span>
                  <button onClick={clearFile} className="text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 transition-colors">
                  <Upload className="w-8 h-8 text-muted-foreground mb-3" />
                  <span className="text-sm text-muted-foreground">Click to upload or drag and drop</span>
                  <span className="text-xs text-muted-foreground mt-1">PDF or TXT files</span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.txt,text/plain,application/pdf"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Text input */}
            <div className="space-y-2">
              <Label htmlFor="resumeText" className="text-base">Or paste your resume text</Label>
              <Textarea
                id="resumeText"
                placeholder="Paste your full resume text here...

Include your:
• Work experience
• Education
• Skills
• Projects
• Contact information"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                className="min-h-[300px]"
              />
              <p className="text-sm text-muted-foreground">
                For best results, include all sections of your resume.
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-between">
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
              disabled={generating || !resumeText.trim()}
            >
              {generating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  Analyzing Resume...
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
