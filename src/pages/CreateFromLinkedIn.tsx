import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Upload, Linkedin, Loader2, Sparkles, X, AlertTriangle, FileText, ExternalLink, Link2 } from "lucide-react";
import { ExtractedDataReview, ExtractedData } from "@/components/resume/ExtractedDataReview";
import type { User } from "@supabase/supabase-js";

type Step = "upload" | "review" | "generating";
type InputMethod = "url" | "paste";

export default function CreateFromLinkedIn() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<Step>("upload");
  const [inputMethod, setInputMethod] = useState<InputMethod>("paste");
  const [parsing, setParsing] = useState(false);
  const [scraping, setScraping] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [linkedinText, setLinkedinText] = useState("");
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
        description: "Please also paste your LinkedIn profile text below for accurate extraction.",
      });
    } else if (file.type === "text/plain" || file.name.endsWith(".txt")) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setLinkedinText(event.target?.result as string);
        setFileName(file.name);
      };
      reader.readAsText(file);
    } else {
      toast({
        title: "Unsupported file type",
        description: "Please upload a PDF or TXT file exported from LinkedIn.",
        variant: "destructive",
      });
    }
  };

  const clearFile = () => {
    setFileName("");
    setLinkedinText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleScrapeUrl = async () => {
    if (!user || !linkedinUrl.trim()) return;
    
    setScraping(true);
    try {
      const response = await supabase.functions.invoke("scrape-linkedin", {
        body: { url: linkedinUrl.trim() }
      });

      if (response.error) throw new Error(response.error.message);

      const data = response.data;
      
      if (!data.success) {
        // If LinkedIn scraping isn't supported, suggest paste option
        if (data.fallbackToPaste) {
          toast({ 
            title: "LinkedIn URL scraping not available", 
            description: "Please switch to 'Paste Text' tab and copy your profile content manually.", 
            variant: "default" 
          });
          setInputMethod("paste");
          return;
        }
        throw new Error(data.error || "Failed to scrape LinkedIn profile");
      }

      // Set the scraped content and proceed to extraction
      setLinkedinText(data.content);
      
      toast({
        title: "Profile fetched!",
        description: "Extracting your professional information...",
      });
      
      // Automatically trigger extraction
      await handleExtractFromText(data.content);
      
    } catch (error: any) {
      console.error("Scraping error:", error);
      toast({ 
        title: "Could not fetch profile", 
        description: error.message || "Try pasting your profile text manually instead.", 
        variant: "destructive" 
      });
    } finally {
      setScraping(false);
    }
  };

  const handleExtractFromText = async (text: string) => {
    if (!user || !text.trim()) return;
    
    setParsing(true);
    try {
      const response = await supabase.functions.invoke("parse-linkedin", {
        body: { linkedinText: text }
      });

      if (response.error) throw new Error(response.error.message);

      const parsedData = response.data;
      
      if (parsedData.error) {
        throw new Error(parsedData.error);
      }

      setExtractedData({
        ...parsedData,
        rawText: text
      });
      
      setStep("review");

      if (parsedData.warnings?.length > 0) {
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

  const handleExtract = async () => {
    await handleExtractFromText(linkedinText);
  };

  const handleConfirmAndGenerate = async () => {
    if (!user || !extractedData) return;
    
    setGenerating(true);
    setStep("generating");
    
    try {
      const name = extractedData.heroTitle?.split(" - ")[0] || "portfolio";
      const username = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "") + "-" + Date.now().toString(36);

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
          resume_text: extractedData.rawText || linkedinText,
          resume_updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;

      toast({ 
        title: "Portfolio created from LinkedIn!", 
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
              <span className="text-sm font-medium">Import</span>
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
                <div className="w-16 h-16 rounded-2xl bg-[#0A66C2]/10 flex items-center justify-center mx-auto mb-4">
                  <Linkedin className="w-8 h-8 text-[#0A66C2]" />
                </div>
                <h1 className="font-display text-4xl font-bold mb-3">Import from LinkedIn</h1>
                <p className="text-lg text-muted-foreground max-w-xl mx-auto">
                  Paste your LinkedIn profile URL or export your profile as PDF. We'll extract your professional information for review.
                </p>
              </div>

              <div className="bg-card p-8 rounded-2xl border border-border/50">
                <Tabs value={inputMethod} onValueChange={(v) => setInputMethod(v as InputMethod)}>
                  <TabsList className="grid w-full grid-cols-2 mb-6">
                    <TabsTrigger value="url" className="flex items-center gap-2">
                      <Link2 className="w-4 h-4" />
                      Paste URL
                    </TabsTrigger>
                    <TabsTrigger value="paste" className="flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Paste Text
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="url" className="space-y-6">
                    <div className="space-y-3">
                      <Label htmlFor="linkedinUrl" className="text-base">Your LinkedIn profile URL</Label>
                      <Input
                        id="linkedinUrl"
                        type="url"
                        placeholder="https://linkedin.com/in/your-username"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="h-12 text-base"
                      />
                      <p className="text-sm text-muted-foreground">
                        Enter your public LinkedIn profile URL. AI will extract your professional information automatically.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
                      <Button variant="outline" asChild>
                        <Link to="/create">
                          <ArrowLeft className="w-4 h-4 mr-2" />
                          Back
                        </Link>
                      </Button>
                      <Button 
                        variant="gradient" 
                        size="lg" 
                        onClick={handleScrapeUrl}
                        disabled={scraping || parsing || !linkedinUrl.trim()}
                      >
                        {scraping ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Fetching Profile...
                          </>
                        ) : parsing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Extracting...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Extract & Review
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>

                  <TabsContent value="paste" className="space-y-6">
                    {/* How to export guide */}
                    <div className="bg-secondary/30 p-4 rounded-xl">
                      <h3 className="font-semibold mb-3 flex items-center gap-2 text-sm">
                        <FileText className="w-4 h-4 text-primary" />
                        How to export your LinkedIn profile
                      </h3>
                      <ol className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">1</span>
                          <span>Go to your LinkedIn profile and click <strong>"More"</strong></span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">2</span>
                          <span>Select <strong>"Save to PDF"</strong> to download</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <span className="flex-shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-medium flex items-center justify-center">3</span>
                          <span>Open the PDF, copy all text, and paste below</span>
                        </li>
                      </ol>
                      <a 
                        href="https://www.linkedin.com/in/" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 mt-3 text-primary hover:underline text-sm"
                      >
                        Go to LinkedIn Profile
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>

                    {/* File upload */}
                    <div>
                      <Label className="text-base mb-3 block">Upload LinkedIn PDF (optional)</Label>
                      {fileName ? (
                        <div className="flex items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border">
                          <FileText className="w-5 h-5 text-[#0A66C2]" />
                          <span className="flex-1 truncate">{fileName}</span>
                          <button onClick={clearFile} className="text-muted-foreground hover:text-foreground">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <label className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-[#0A66C2]/50 transition-colors">
                          <Upload className="w-6 h-6 text-muted-foreground mb-2" />
                          <span className="text-sm text-muted-foreground">Click to upload your LinkedIn PDF</span>
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
                      <Label htmlFor="linkedinText" className="text-base">Paste your LinkedIn profile text</Label>
                      <Textarea
                        id="linkedinText"
                        placeholder="Copy and paste the full text from your LinkedIn profile PDF here..."
                        value={linkedinText}
                        onChange={(e) => setLinkedinText(e.target.value)}
                        className="min-h-[200px]"
                      />
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-warning" />
                        Paste the complete profile for best results.
                      </p>
                    </div>

                    <div className="flex justify-between pt-4">
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
                        disabled={parsing || !linkedinText.trim()}
                      >
                        {parsing ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Extracting Profile...
                          </>
                        ) : (
                          <>
                            <Sparkles className="w-4 h-4 mr-2" />
                            Extract & Review
                          </>
                        )}
                      </Button>
                    </div>
                  </TabsContent>
                </Tabs>
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
              <div className="w-20 h-20 rounded-full bg-[#0A66C2]/10 flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-10 h-10 text-[#0A66C2] animate-spin" />
              </div>
              <h2 className="text-2xl font-bold mb-3">Creating Your Portfolio</h2>
              <p className="text-muted-foreground">
                Building your professional portfolio from your LinkedIn profile...
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
