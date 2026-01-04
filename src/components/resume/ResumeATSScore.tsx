import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Loader2, Target, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ResumeContent {
  hero_title?: string | null;
  about_text?: string;
  skills?: string[];
  experience?: Array<{
    company: string;
    role: string;
    period: string;
    description: string;
  }>;
  education?: Array<{
    institution: string;
    degree: string;
    year: string;
  }>;
}

interface ResumeATSScoreProps {
  resume: ResumeContent;
  currentScore: number | null;
  suggestions: any[] | null;
  onScoreUpdate: (score: number, suggestions: any[]) => void;
}

export function ResumeATSScore({ resume, currentScore, suggestions, onScoreUpdate }: ResumeATSScoreProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const analyzeResume = async () => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("evaluate-portfolio", {
        body: {
          portfolio: {
            hero_title: resume.hero_title,
            about_text: resume.about_text,
            skills: resume.skills,
            experience: resume.experience,
            education: resume.education,
          },
          mode: "ats"
        }
      });

      if (error) throw error;

      const score = data?.score || 0;
      const newSuggestions = data?.suggestions || [];
      
      onScoreUpdate(score, newSuggestions);
      toast({ title: `ATS Score: ${score}/100` });
    } catch (error: any) {
      toast({ title: "Analysis failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-success";
    if (score >= 60) return "text-warning";
    return "text-destructive";
  };

  const getProgressColor = (score: number) => {
    if (score >= 80) return "bg-success";
    if (score >= 60) return "bg-warning";
    return "bg-destructive";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" />
          <h3 className="font-semibold">ATS Compatibility Score</h3>
        </div>
        <Button variant="outline" size="sm" onClick={analyzeResume} disabled={loading}>
          {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          {currentScore !== null ? "Re-analyze" : "Analyze"}
        </Button>
      </div>

      {currentScore !== null && (
        <div className="space-y-4">
          {/* Score display */}
          <div className="p-4 rounded-xl bg-secondary/30 border border-border/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-muted-foreground">Overall Score</span>
              <span className={`text-2xl font-bold ${getScoreColor(currentScore)}`}>
                {currentScore}/100
              </span>
            </div>
            <Progress value={currentScore} className="h-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {currentScore >= 80 
                ? "Excellent! Your resume is well-optimized for ATS."
                : currentScore >= 60
                ? "Good, but there's room for improvement."
                : "Your resume may have trouble passing ATS filters."}
            </p>
          </div>

          {/* Suggestions */}
          {suggestions && suggestions.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Improvement Suggestions</h4>
              <div className="space-y-2">
                {suggestions.slice(0, 5).map((suggestion: any, index: number) => (
                  <div 
                    key={index}
                    className={`p-3 rounded-lg border ${
                      suggestion.priority === "high" 
                        ? "bg-destructive/5 border-destructive/20" 
                        : suggestion.priority === "medium"
                        ? "bg-warning/5 border-warning/20"
                        : "bg-secondary/30 border-border/50"
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {suggestion.priority === "high" ? (
                        <XCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
                      ) : suggestion.priority === "medium" ? (
                        <AlertCircle className="w-4 h-4 text-warning mt-0.5 flex-shrink-0" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                      )}
                      <p className="text-sm">{typeof suggestion === 'string' ? suggestion : suggestion.text || suggestion.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {currentScore === null && (
        <div className="p-6 rounded-xl bg-secondary/20 border border-dashed border-border text-center">
          <Target className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">
            Analyze your resume to get an ATS compatibility score and improvement suggestions.
          </p>
        </div>
      )}
    </div>
  );
}
