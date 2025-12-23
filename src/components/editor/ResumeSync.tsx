import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { 
  RefreshCw, FileText, Loader2,
  ArrowRight, Download
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ResumePDFPreview } from "./ResumePDFPreview";

interface ResumeSyncProps {
  portfolio: {
    id: string;
    role: string;
    hero_title: string | null;
    hero_subtitle: string | null;
    about_text: string | null;
    skills: string[];
    projects: any[];
    experience: any[];
    education?: any[];
    links: any;
  };
  currentResumeText: string | null;
  onSyncComplete: (updates: any) => void;
}

export function ResumeSync({ portfolio, currentResumeText, onSyncComplete }: ResumeSyncProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [direction, setDirection] = useState<"resume_to_portfolio" | "portfolio_to_resume" | null>(null);
  const [newResumeText, setNewResumeText] = useState("");
  const [showPDFPreview, setShowPDFPreview] = useState(false);
  const { toast } = useToast();

  const handleSync = async (syncDirection: "resume_to_portfolio") => {
    setSyncing(true);
    setDirection(syncDirection);

    try {
      console.log("Syncing with direction:", syncDirection, "portfolio:", portfolio);
      
      const response = await supabase.functions.invoke("sync-resume-portfolio", {
        body: {
          direction: syncDirection,
          portfolio: portfolio,
          resumeText: newResumeText
        }
      });

      console.log("Sync response:", response);

      if (response.error) throw new Error(response.error.message);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

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
      setNewResumeText("");
      setIsOpen(false);
    } catch (error: any) {
      console.error("Sync error:", error);
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

  const handleGeneratePDF = () => {
    setShowPDFPreview(true);
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
                <ArrowRight className="w-4 h-4" />
                Update Portfolio from Resume
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Paste a new version of your resume to update your portfolio content.
              </p>
              <Textarea
                placeholder="Paste your updated resume here..."
                value={newResumeText}
                onChange={(e) => setNewResumeText(e.target.value)}
                className="min-h-[150px] mb-3"
              />
              <Button
                onClick={() => handleSync("resume_to_portfolio")}
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

            {/* Generate ATS PDF from portfolio */}
            <div className="p-4 rounded-xl border border-border bg-card">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Generate ATS-Friendly Resume PDF
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Create a professional PDF resume from your portfolio. Uses single-column ATS-friendly format.
              </p>
              <Button
                onClick={handleGeneratePDF}
                size="sm"
                variant="outline"
              >
                <Download className="w-4 h-4 mr-2" />
                Generate PDF Resume
              </Button>
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

      <ResumePDFPreview
        portfolio={portfolio}
        open={showPDFPreview}
        onOpenChange={setShowPDFPreview}
      />
    </>
  );
}
