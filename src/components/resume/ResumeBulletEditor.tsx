import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Wand2, RotateCcw, Plus, Trash2, GripVertical, Loader2,
  Sparkles, Zap, Target, MessageSquare
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

interface ResumeBulletEditorProps {
  experience: Experience[];
  onChange: (experience: Experience[]) => void;
  onReset: () => void;
  hasOverride: boolean;
}

export function ResumeBulletEditor({ experience, onChange, onReset, hasOverride }: ResumeBulletEditorProps) {
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [loadingIndex, setLoadingIndex] = useState<number | null>(null);
  const { toast } = useToast();

  const updateExperience = (index: number, updates: Partial<Experience>) => {
    const newExperience = [...experience];
    newExperience[index] = { ...newExperience[index], ...updates };
    onChange(newExperience);
  };

  const removeExperience = (index: number) => {
    onChange(experience.filter((_, i) => i !== index));
  };

  const addExperience = () => {
    onChange([...experience, { company: "", role: "", period: "", description: "" }]);
  };

  const enhanceBullet = async (index: number, action: "impact" | "ats" | "shorten" | "quantify") => {
    setLoadingIndex(index);
    
    const prompts: Record<string, string> = {
      impact: "Rewrite this experience bullet to be more impact-driven. Focus on achievements and outcomes. Start with strong action verbs.",
      ats: "Rewrite this experience bullet to be more ATS-friendly. Use industry-standard keywords and clear, scannable formatting.",
      shorten: "Condense this experience bullet while keeping the most important achievements. Make it concise but impactful.",
      quantify: "Enhance this experience bullet by adding quantifiable metrics and numbers where possible (e.g., percentages, dollar amounts, team sizes).",
    };

    try {
      const { data, error } = await supabase.functions.invoke("ai-edit-content", {
        body: {
          content: experience[index].description,
          command: prompts[action],
          mode: "bullet"
        }
      });

      if (error) throw error;

      updateExperience(index, { description: data.edited || experience[index].description });
      toast({ title: "Bullet enhanced!" });
    } catch (error: any) {
      toast({ title: "Enhancement failed", description: error.message, variant: "destructive" });
    } finally {
      setLoadingIndex(null);
    }
  };

  return (
    <div className="space-y-4">
      {experience.map((exp, index) => (
        <div 
          key={index}
          className="p-4 rounded-lg bg-secondary/20 border border-border/50 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />
              <span className="text-sm font-medium">{exp.role || `Position ${index + 1}`}</span>
            </div>
            <div className="flex items-center gap-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" disabled={loadingIndex === index}>
                    {loadingIndex === index ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Wand2 className="w-4 h-4" />
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => enhanceBullet(index, "impact")}>
                    <Zap className="w-4 h-4 mr-2" />
                    Make it impact-driven
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => enhanceBullet(index, "ats")}>
                    <Target className="w-4 h-4 mr-2" />
                    Make it ATS-friendly
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => enhanceBullet(index, "quantify")}>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Add quantifiable metrics
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => enhanceBullet(index, "shorten")}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Shorten & condense
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <Button variant="ghost" size="sm" onClick={() => removeExperience(index)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Role</Label>
              <Input
                value={exp.role}
                onChange={(e) => updateExperience(index, { role: e.target.value })}
                placeholder="Job Title"
                className="h-8 text-sm"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">Company</Label>
              <Input
                value={exp.company}
                onChange={(e) => updateExperience(index, { company: e.target.value })}
                placeholder="Company Name"
                className="h-8 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Period</Label>
            <Input
              value={exp.period}
              onChange={(e) => updateExperience(index, { period: e.target.value })}
              placeholder="Jan 2020 - Present"
              className="h-8 text-sm"
            />
          </div>

          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Description / Bullet Points</Label>
            <Textarea
              value={exp.description}
              onChange={(e) => updateExperience(index, { description: e.target.value })}
              placeholder="• Led development of...&#10;• Improved system performance by...&#10;• Collaborated with..."
              className="min-h-[100px] text-sm"
            />
          </div>
        </div>
      ))}

      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={addExperience}>
          <Plus className="w-4 h-4 mr-1" /> Add Experience
        </Button>
        {hasOverride && (
          <Button variant="ghost" size="sm" onClick={onReset}>
            <RotateCcw className="w-4 h-4 mr-1" /> Reset to portfolio
          </Button>
        )}
      </div>
    </div>
  );
}
