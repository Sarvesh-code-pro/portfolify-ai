import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, TrendingUp, AlertCircle, CheckCircle, Loader2, RefreshCw
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface Suggestion {
  category: string;
  priority: string;
  suggestion: string;
}

interface QualityScoreProps {
  portfolio: any;
  onScoreUpdate?: (score: number, suggestions: Suggestion[]) => void;
}

export function QualityScore({ portfolio, onScoreUpdate }: QualityScoreProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [score, setScore] = useState<number | null>(portfolio?.quality_score || null);
  const [summary, setSummary] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>(
    Array.isArray(portfolio?.quality_suggestions) ? portfolio.quality_suggestions as Suggestion[] : []
  );
  const { toast } = useToast();

  const evaluate = async () => {
    setEvaluating(true);
    
    try {
      const response = await supabase.functions.invoke("evaluate-portfolio", {
        body: { portfolio }
      });

      if (response.error) throw new Error(response.error.message);
      
      if (response.data.error) {
        throw new Error(response.data.error);
      }

      setScore(response.data.score);
      setSummary(response.data.summary);
      setSuggestions(response.data.suggestions || []);
      
      onScoreUpdate?.(response.data.score, response.data.suggestions || []);
      
      toast({ title: `Quality score: ${response.data.score}/100` });
    } catch (error: any) {
      toast({ 
        title: "Evaluation failed", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setEvaluating(false);
    }
  };

  const getScoreColor = (s: number) => {
    if (s >= 80) return "text-success";
    if (s >= 60) return "text-warning";
    return "text-destructive";
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/20 text-destructive";
      case "medium": return "bg-warning/20 text-warning";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "projects": return "📁";
      case "about": return "📝";
      case "skills": return "⚡";
      case "experience": return "💼";
      case "links": return "🔗";
      default: return "💡";
    }
  };

  return (
    <>
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => {
          setIsOpen(true);
          if (score === null) {
            evaluate();
          }
        }}
        className="gap-2"
      >
        <Star className="w-4 h-4" />
        {score !== null ? `Score: ${score}` : "Quality Score"}
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Portfolio Quality Score
            </DialogTitle>
            <DialogDescription>
              AI-powered evaluation of your portfolio from a recruiter's perspective.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 pt-4">
            {evaluating ? (
              <div className="flex flex-col items-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
                <p className="text-sm text-muted-foreground">Analyzing your portfolio...</p>
              </div>
            ) : score !== null ? (
              <>
                {/* Score display */}
                <div className="text-center p-6 rounded-2xl bg-card border border-border">
                  <div className={`text-6xl font-bold ${getScoreColor(score)}`}>
                    {score}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">out of 100</div>
                  <Progress value={score} className="mt-4" />
                  {summary && (
                    <p className="text-sm mt-4 text-muted-foreground">{summary}</p>
                  )}
                </div>

                {/* Suggestions */}
                {suggestions.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="font-semibold text-sm uppercase tracking-wide text-muted-foreground">
                      Suggestions to Improve
                    </h3>
                    {suggestions.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="p-4 rounded-xl border border-border bg-secondary/30"
                      >
                        <div className="flex items-start gap-3">
                          <span className="text-lg">{getCategoryIcon(suggestion.category)}</span>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor(suggestion.priority)}`}>
                                {suggestion.priority}
                              </span>
                              <span className="text-xs text-muted-foreground capitalize">
                                {suggestion.category}
                              </span>
                            </div>
                            <p className="text-sm">{suggestion.suggestion}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Re-evaluate button */}
                <Button 
                  variant="outline" 
                  className="w-full" 
                  onClick={evaluate}
                  disabled={evaluating}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Re-evaluate
                </Button>
              </>
            ) : (
              <div className="text-center py-8">
                <Button onClick={evaluate}>
                  <Star className="w-4 h-4 mr-2" />
                  Evaluate Portfolio
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
