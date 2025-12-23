import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, FileText, Loader2, Sparkles, X, AlertTriangle } from "lucide-react";
import { ExtractedDataReview, ExtractedData } from "@/components/resume/ExtractedDataReview";
import type { User } from "@supabase/supabase-js";

type Step = "upload" | "review" | "generating";

export default function CreateFromResume() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("upload");
  const [parsing, setParsing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [resumeText, setResumeText] = useState("");
  const [fileName, setFileName] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
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
      setFileName(file.name);
      toast({
        title: "PDF uploaded",
        description: "Please also paste your resume text for best results.",
      });
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

  const handleExtract = async () => {
    if (!user || !resumeText.trim()) return;
    
    setParsing(true);
    try {
      const response = await supabase.functions.invoke("parse-resume", {
        body: { resumeText }
      });

      if (response.error) throw new Error(response.error.message);

      const parsedData = response.data;
      
      if (parsedData.error) {
        throw new Error(parsedData.error);
      }

      // Store raw text with extracted data
      setExtractedData({
        ...parsedData,
        rawText: resumeText
      });
      
      setStep("review");

      // Show warning if there are any issues
      if (parsedData.warnings?.length > 0 || parsedData.unmappedSections?.length > 0) {
        toast({
          title: "Review needed",
          description: "Some content may need your attention. Please review the extracted information.",
          variant: "default",
        });
      }
    } catch (error: any) {
      console.error("Extraction error:", error);
      toast({ 
        title: "Extraction failed", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
    } finally {
      setParsing(false);
    }
  };

  const handleConfirmAndGenerate = async () => {
    if (!user || !extractedData) return;
    
    setGenerating(true);
    setStep("generating");
    
    try {
      // Generate unique username
      const name = extractedData.heroTitle?.split(" - ")[0] || "portfolio";
      const username = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);

      // Create portfolio in database with the user-reviewed data
      const { data: portfolio, error } = await supabase
        .from("portfolios")
        .insert({
          user_id: user.id,
          username,
          role: extractedData.detectedRole || "developer",
          hero_title: extractedData.heroTitle,
          hero_subtitle: extractedData.heroSubtitle,
          about_text: extractedData.about,
          skills: extractedData.skills || [],
          projects: extractedData.projects || [],
          experience: extractedData.experience || [],
          education: extractedData.education || [],
          links: {
            ...extractedData.extractedLinks,
            certifications: extractedData.certifications,
            achievements: extractedData.achievements
          },
          template: "minimal",
          status: "draft",
          resume_text: extractedData.rawText || resumeText,
          resume_updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: "Portfolio created!", 
        description: `Your ${extractedData.detectedRole?.replace("_", " ")} portfolio is ready. Customize it in the editor.` 
      });
      navigate(`/editor/${portfolio.id}`);
    } catch (error: any) {
      console.error("Generation error:", error);
      toast({ 
        title: "Generation failed", 
        description: error.message || "Please try again", 
        variant: "destructive" 
      });
      setStep("review");
    } finally {
      setGenerating(false);
    }
  };

  const handleBackToUpload = () => {
    setStep("upload");
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

        <div className="max-w-4xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step === "upload" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "upload" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                1
              </div>
              <span className="text-sm font-medium">Upload</span>
            </div>
            <div className="w-12 h-px bg-border" />
            <div className={`flex items-center gap-2 ${step === "review" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "review" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                2
              </div>
              <span className="text-sm font-medium">Review</span>
            </div>
            <div className="w-12 h-px bg-border" />
            <div className={`flex items-center gap-2 ${step === "generating" ? "text-primary" : "text-muted-foreground"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step === "generating" ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                3
              </div>
              <span className="text-sm font-medium">Generate</span>
            </div>
          </div>

          {step === "upload" && (
            <>
              <div className="text-center mb-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-primary" />
                </div>
                <h1 className="font-display text-4xl font-bold mb-3">Create from Resume</h1>
                <p className="text-lg text-muted-foreground">
                  Upload your resume or paste the text. AI will extract ALL your information for review.
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
• Work experience with dates and achievements
• Education with degrees and years
• Skills (technical and soft skills)
• Projects with descriptions
• Certifications
• Contact information (email, phone, LinkedIn, etc.)"
                    value={resumeText}
                    onChange={(e) => setResumeText(e.target.value)}
                    className="min-h-[300px]"
                  />
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    Include ALL sections for complete extraction. You'll review before generating.
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
                  onClick={handleExtract}
                  disabled={parsing || !resumeText.trim()}
                >
                  {parsing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Extracting Information...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 mr-2" />
                      Extract & Review
                    </>
                  )}
                </Button>
              </div>
            </>
          )}

          {step === "review" && extractedData && (
            <div className="bg-card p-8 rounded-2xl border border-border/50">
              <ExtractedDataReview
                data={extractedData}
                onChange={setExtractedData}
                onConfirm={handleConfirmAndGenerate}
                onBack={handleBackToUpload}
                isGenerating={generating}
              />
            </div>
          )}

          {step === "generating" && (
            <div className="text-center py-20">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Creating Your Portfolio</h2>
              <p className="text-muted-foreground">
                Building your professional portfolio from the reviewed information...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
