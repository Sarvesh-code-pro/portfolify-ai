import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, FileText, Loader2, X, Upload,
  ArrowRight
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ResumeSyncProps {
  portfolioId: string;
  currentResumeText: string | null;
  onSyncComplete: (updates: any) => void;
}

export function ResumeSync({ portfolioId, currentResumeText, onSyncComplete }: ResumeSyncProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [direction, setDirection] = useState<"resume_to_portfolio" | "portfolio_to_resume" | null>(null);
  const [newResumeText, setNewResumeText] = useState("");
  const [generatedResume, setGeneratedResume] = useState("");
  const { toast } = useToast();

  const handleSync = async (syncDirection: "resume_to_portfolio" | "portfolio_to_resume", portfolio: any) => {
    setSyncing(true);
    setDirection(syncDirection);

    try {
      const response = await supabase.functions.invoke("sync-resume-portfolio", {
        body: {
          direction: syncDirection,
          portfolio,
          resumeText: syncDirection === "resume_to_portfolio" ? newResumeText : undefined
        }
      });

      if (response.error) throw new Error(response.error.message);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      if (syncDirection === "resume_to_portfolio") {
        onSyncComplete({
          hero_title: response.data.heroTitle,
          hero_subtitle: response.data.heroSubtitle,
          about_text: response.data.about,
          skills: response.data.skills,
          projects: response.data.projects,
          experience: response.data.experience,
          resume_text: newResumeText,
          resume_updated_at: new Date().toISOString()
        });
        toast({ title: "Portfolio updated from resume" });
        setIsOpen(false);
      } else {
        setGeneratedResume(response.data.resumeText);
        toast({ title: "Resume generated from portfolio" });
      }
    } catch (error: any) {
      toast({ 
        title: "Sync failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setSyncing(false);
      setDirection(null);
    }
  };

  const copyResume = () => {
    navigator.clipboard.writeText(generatedResume);
    toast({ title: "Resume copied to clipboard" });
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <RefreshCw className="w-4 h-4" />
        Sync Resume
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Resume & Portfolio Sync
            </DialogTitle>
            <DialogDescription>
              Keep your resume and portfolio in sync. Update one from the other.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {/* Update portfolio from resume */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Update Portfolio from Resume
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paste a new version of your resume to update your portfolio.
              </p>
              <Textarea
                placeholder="Paste your updated resume here..."
                value={newResumeText}
                onChange={(e) => setNewResumeText(e.target.value)}
                className="min-h-[150px] mb-3"
              />
              <Button
                onClick={() => handleSync("resume_to_portfolio", {})}
                disabled={syncing || !newResumeText.trim()}
                size="sm"
              >
                {syncing && direction === "resume_to_portfolio" ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                Update Portfolio
              </Button>
            </div>

            {/* Generate resume from portfolio */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Generate Resume from Portfolio
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a text resume from your current portfolio content.
              </p>
              
              {generatedResume ? (
                <div className="space-y-3">
                  <Textarea
                    value={generatedResume}
                    readOnly
                    className="min-h-[200px] font-mono text-sm"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={copyResume}>
                      Copy to Clipboard
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => setGeneratedResume("")}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
              ) : (
                <Button
                  onClick={() => handleSync("portfolio_to_resume", {})}
                  disabled={syncing}
                  size="sm"
                  variant="outline"
                >
                  {syncing && direction === "portfolio_to_resume" ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <FileText className="w-4 h-4 mr-2" />
                  )}
                  Generate Resume
                </Button>
              )}
            </div>

            {/* Current resume */}
            {currentResumeText && (
              <div className="p-4 rounded-xl border border-border/50 bg-secondary/30">
                <h3 className="font-semibold mb-2 text-sm text-muted-foreground">
                  Current stored resume ({currentResumeText.length} characters)
                </h3>
                <p className="text-sm text-muted-foreground line-clamp-3">
                  {currentResumeText}
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
