import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Sparkles, Target, CheckCircle, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ResumeContent {
  about_text?: string;
  skills?: string[];
  experience?: any[];
}

interface OptimizedContent {
  summary: string;
  skills: string[];
}

interface ResumeJobOptimizerProps {
  jobDescription: string;
  onJobDescriptionChange: (jd: string) => void;
  resume: ResumeContent;
  onOptimizedContent: (content: OptimizedContent) => void;
}

export function ResumeJobOptimizer({ 
  jobDescription, 
  onJobDescriptionChange, 
  resume,
  onOptimizedContent 
}: ResumeJobOptimizerProps) {
  const [analyzing, setAnalyzing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<OptimizedContent | null>(null);
  const [matchedKeywords, setMatchedKeywords] = useState<string[]>([]);
  const [missingKeywords, setMissingKeywords] = useState<string[]>([]);
  const { toast } = useToast();

  const analyzeJobDescription = async () => {
    if (!jobDescription.trim()) {
      toast({ title: "Please paste a job description first", variant: "destructive" });
      return;
    }

    setAnalyzing(true);

    try {
      const { data, error } = await supabase.functions.invoke("ai-edit-content", {
        body: {
          content: JSON.stringify({
            summary: resume.about_text,
            skills: resume.skills,
            experience: resume.experience,
          }),
          command: `Analyze this resume against the following job description and optimize it.
          
Job Description:
${jobDescription}

Return a JSON object with:
1. "optimized_summary": A rewritten professional summary tailored to this job
2. "optimized_skills": An array of skills reordered/adjusted to match job requirements (prioritize matching skills, add relevant missing skills)
3. "matched_keywords": Array of keywords from the job description that appear in the resume
4. "missing_keywords": Array of important keywords from the job description missing from the resume

Keep the original facts but optimize language and emphasis for this specific job.`,
          mode: "job_optimize"
        }
      });

      if (error) throw error;

      // Parse the response
      let parsed;
      try {
        parsed = typeof data.edited === 'string' ? JSON.parse(data.edited) : data.edited;
      } catch {
        parsed = data;
      }

      setPreviewContent({
        summary: parsed.optimized_summary || resume.about_text || "",
        skills: parsed.optimized_skills || resume.skills || [],
      });
      setMatchedKeywords(parsed.matched_keywords || []);
      setMissingKeywords(parsed.missing_keywords || []);
      setPreviewOpen(true);
    } catch (error: any) {
      toast({ title: "Optimization failed", description: error.message, variant: "destructive" });
    } finally {
      setAnalyzing(false);
    }
  };

  const applyOptimization = () => {
    if (previewContent) {
      onOptimizedContent(previewContent);
      setPreviewOpen(false);
      toast({ title: "Optimization applied!" });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Target className="w-5 h-5 text-primary" />
        <h3 className="font-semibold">Job Description Optimizer</h3>
      </div>

      <p className="text-sm text-muted-foreground">
        Paste a job description to optimize your resume for that specific role.
      </p>

      <div className="space-y-2">
        <Label>Job Description</Label>
        <Textarea
          value={jobDescription}
          onChange={(e) => onJobDescriptionChange(e.target.value)}
          placeholder="Paste the job description here...

We're looking for a Senior Software Engineer with experience in...
Requirements:
- 5+ years of experience
- Proficiency in React, TypeScript
- ..."
          className="min-h-[200px]"
        />
      </div>

      <Button 
        onClick={analyzeJobDescription} 
        disabled={analyzing || !jobDescription.trim()}
        className="w-full"
      >
        {analyzing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="w-4 h-4 mr-2" />
            Optimize for This Job
          </>
        )}
      </Button>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Optimization Preview
            </DialogTitle>
            <DialogDescription>
              Review the suggested changes before applying them to your resume.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4">
            {/* Keyword Analysis */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle className="w-4 h-4 text-success" />
                  <span className="font-medium text-sm">Matched Keywords</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {matchedKeywords.slice(0, 10).map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-success/20 text-success">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-warning" />
                  <span className="font-medium text-sm">Missing Keywords</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {missingKeywords.slice(0, 10).map((kw, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs rounded-full bg-warning/20 text-warning">
                      {kw}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Optimized Summary */}
            {previewContent && (
              <>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Optimized Summary</Label>
                  <div className="p-4 rounded-lg bg-secondary/30 border border-border/50">
                    <p className="text-sm">{previewContent.summary}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-medium">Optimized Skills</Label>
                  <div className="flex flex-wrap gap-2">
                    {previewContent.skills.map((skill, i) => (
                      <span 
                        key={i} 
                        className={`px-3 py-1 text-sm rounded-full ${
                          matchedKeywords.some(kw => skill.toLowerCase().includes(kw.toLowerCase()))
                            ? "bg-success/20 text-success border border-success/30"
                            : "bg-secondary text-foreground border border-border"
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Cancel
            </Button>
            <Button onClick={applyOptimization}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
