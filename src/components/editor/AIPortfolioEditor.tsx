import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sparkles, 
  Loader2, 
  Undo2, 
  X,
  Check,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Wand2,
  LayoutGrid,
  Type,
  Palette,
  Eye,
  ArrowUpDown
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { executeAIPlan, createSnapshotDiff, type SnapshotDiff } from "@/lib/ai-action-executor";
import type { AIEditPlan, PortfolioAction } from "@/types/ai-portfolio-actions";
import type { Portfolio } from "@/types/portfolio";
import { motion, AnimatePresence } from "framer-motion";

interface AIPortfolioEditorProps {
  portfolio: Portfolio;
  onUpdate: (updates: Partial<Portfolio>) => void;
  onSave: () => Promise<void>;
}

interface HistoryEntry {
  id: string;
  command: string;
  plan: AIEditPlan;
  diff: SnapshotDiff;
  timestamp: Date;
}

const EXAMPLE_COMMANDS = [
  { icon: Wand2, text: "Make my portfolio more creative and modern" },
  { icon: ArrowUpDown, text: "Move projects above experience" },
  { icon: Eye, text: "Focus on my development skills, hide testimonials" },
  { icon: Type, text: "Rewrite everything with a senior engineer tone" },
  { icon: Palette, text: "Use a dark theme with blue accents" },
  { icon: LayoutGrid, text: "Switch to minimal layout" },
];

const ACTION_ICONS: Record<string, typeof Sparkles> = {
  reorder_sections: ArrowUpDown,
  toggle_section_visibility: Eye,
  update_section_title: Type,
  update_content: Type,
  update_theme: Palette,
  update_layout: LayoutGrid,
  add_section: LayoutGrid,
  batch_update: Sparkles,
};

function ActionPreviewCard({ action }: { action: PortfolioAction }) {
  const Icon = ACTION_ICONS[action.type] || Sparkles;
  
  const getActionDescription = () => {
    switch (action.type) {
      case 'reorder_sections':
        return `Reorder sections: ${(action as any).newOrder?.slice(0, 4).join(' → ')}...`;
      case 'toggle_section_visibility':
        return `${(action as any).visible ? 'Show' : 'Hide'} ${(action as any).sectionId} section`;
      case 'update_section_title':
        return `Rename ${(action as any).sectionId} to "${(action as any).newTitle}"`;
      case 'update_content':
        const updates = (action as any).updates || {};
        const fields = Object.keys(updates).filter(k => updates[k] !== undefined);
        return `Update: ${fields.join(', ')}`;
      case 'update_theme':
        return `Change theme colors${(action as any).colorMode ? ` (${(action as any).colorMode} mode)` : ''}`;
      case 'update_layout':
        return `Switch to ${(action as any).template} template`;
      case 'add_section':
        return `Add new section: "${(action as any).title}"`;
      default:
        return action.type.replace(/_/g, ' ');
    }
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-secondary/50 rounded-lg">
      <Icon className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{getActionDescription()}</p>
        {action.reasoning && (
          <p className="text-xs text-muted-foreground mt-1">{action.reasoning}</p>
        )}
      </div>
    </div>
  );
}

export function AIPortfolioEditor({ portfolio, onUpdate, onSave }: AIPortfolioEditorProps) {
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [pendingPlan, setPendingPlan] = useState<AIEditPlan | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);
  const [showExamples, setShowExamples] = useState(true);
  const { toast } = useToast();

  const generatePlan = useCallback(async (cmd: string) => {
    if (!cmd.trim()) {
      toast({ title: "Please enter a command", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    setShowExamples(false);

    try {
      const { data, error } = await supabase.functions.invoke("ai-portfolio-editor", {
        body: {
          command: cmd,
          portfolio: {
            hero_title: portfolio.hero_title,
            hero_subtitle: portfolio.hero_subtitle,
            about_text: portfolio.about_text,
            skills: portfolio.skills,
            experience: portfolio.experience,
            projects: portfolio.projects,
            testimonials: portfolio.testimonials,
            section_order: portfolio.section_order,
            section_visibility: portfolio.section_visibility,
            section_titles: portfolio.section_titles,
            template: portfolio.template,
            theme: portfolio.theme,
            color_mode: portfolio.color_mode,
            role: portfolio.role
          }
        }
      });

      if (error) throw error;

      if (!data?.success || !data?.plan) {
        throw new Error(data?.error || "Failed to generate edit plan");
      }

      setPendingPlan(data.plan as AIEditPlan);
      
      toast({ 
        title: "Edit plan ready", 
        description: data.plan.summary 
      });
    } catch (error: any) {
      console.error("AI edit error:", error);
      toast({ 
        title: "Failed to generate plan", 
        description: error.message || "Please try again",
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  }, [portfolio, toast]);

  const applyPlan = useCallback(async () => {
    if (!pendingPlan) return;

    try {
      const result = executeAIPlan(pendingPlan, portfolio);
      
      if (!result.success && result.errors.length > 0) {
        toast({ 
          title: "Some changes failed", 
          description: result.errors[0],
          variant: "destructive" 
        });
      }

      if (result.warnings.length > 0) {
        console.warn("AI edit warnings:", result.warnings);
      }

      // Create history entry before applying
      const diff = createSnapshotDiff(portfolio, result.updates);
      const historyEntry: HistoryEntry = {
        id: crypto.randomUUID(),
        command,
        plan: pendingPlan,
        diff,
        timestamp: new Date()
      };

      // Apply updates
      onUpdate(result.updates);

      // Update history
      setHistory(prev => [historyEntry, ...prev].slice(0, 10));

      // Clear state
      setPendingPlan(null);
      setCommand("");

      toast({ 
        title: "Changes applied!", 
        description: pendingPlan.summary 
      });

      // Auto-save
      await onSave();
    } catch (error: any) {
      console.error("Apply plan error:", error);
      toast({ 
        title: "Failed to apply changes", 
        description: error.message,
        variant: "destructive" 
      });
    }
  }, [pendingPlan, portfolio, command, onUpdate, onSave, toast]);

  const undoLastChange = useCallback(() => {
    if (history.length === 0) return;

    const lastEntry = history[0];
    onUpdate(lastEntry.diff.before);
    setHistory(prev => prev.slice(1));

    toast({ 
      title: "Undone", 
      description: `Reverted: "${lastEntry.command}"` 
    });
  }, [history, onUpdate, toast]);

  const cancelPlan = () => {
    setPendingPlan(null);
  };

  if (!isExpanded) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsExpanded(true)}
        className="gap-2 border-primary/30 hover:border-primary"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        AI Editor
        <Badge variant="secondary" className="ml-1 text-[10px]">New</Badge>
      </Button>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-xl p-4 space-y-4 shadow-lg"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-semibold">AI Portfolio Editor</h3>
            <p className="text-xs text-muted-foreground">Describe what you want to change</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {history.length > 0 && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-8 w-8"
              onClick={undoLastChange}
            >
              <Undo2 className="w-4 h-4" />
            </Button>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => setIsExpanded(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Command input */}
      <div className="space-y-2">
        <Textarea
          placeholder="Try: 'Make my portfolio more creative' or 'Move projects above experience'"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !isProcessing && !pendingPlan) {
              e.preventDefault();
              generatePlan(command);
            }
          }}
          disabled={isProcessing || !!pendingPlan}
          className="min-h-[80px] resize-none"
        />
        
        {!pendingPlan && (
          <Button 
            onClick={() => generatePlan(command)}
            disabled={isProcessing || !command.trim()}
            className="w-full"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Edit Plan
              </>
            )}
          </Button>
        )}
      </div>

      {/* Example commands */}
      <AnimatePresence>
        {showExamples && !pendingPlan && !isProcessing && (
          <Collapsible defaultOpen>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="w-full justify-between text-muted-foreground">
                <span className="text-xs">Example commands</span>
                <ChevronDown className="w-3 h-3" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="grid grid-cols-1 gap-1.5 mt-2">
                {EXAMPLE_COMMANDS.map((example, idx) => (
                  <Button
                    key={idx}
                    variant="ghost"
                    size="sm"
                    className="justify-start h-auto py-2 px-3 text-left font-normal text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setCommand(example.text);
                      setShowExamples(false);
                    }}
                  >
                    <example.icon className="w-3.5 h-3.5 mr-2 flex-shrink-0" />
                    <span className="text-xs">{example.text}</span>
                  </Button>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </AnimatePresence>

      {/* Pending plan preview */}
      <AnimatePresence>
        {pendingPlan && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-3"
          >
            <div className="flex items-start gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <AlertCircle className="w-4 h-4 text-primary mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-medium">{pendingPlan.summary}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge 
                    variant={pendingPlan.confidence === 'high' ? 'default' : 'secondary'}
                    className="text-[10px]"
                  >
                    {pendingPlan.confidence} confidence
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {pendingPlan.actions.length} change{pendingPlan.actions.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>

            <ScrollArea className="max-h-[200px]">
              <div className="space-y-2">
                {pendingPlan.actions.map((action, idx) => (
                  <ActionPreviewCard key={idx} action={action} />
                ))}
              </div>
            </ScrollArea>

            <div className="flex gap-2">
              <Button 
                variant="outline" 
                className="flex-1"
                onClick={cancelPlan}
              >
                <X className="w-4 h-4 mr-2" />
                Cancel
              </Button>
              <Button 
                className="flex-1"
                onClick={applyPlan}
              >
                <Check className="w-4 h-4 mr-2" />
                Apply Changes
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && !pendingPlan && (
        <div className="pt-2 border-t border-border">
          <p className="text-xs text-muted-foreground mb-2">
            Recent edits ({history.length})
          </p>
          <div className="space-y-1">
            {history.slice(0, 3).map((entry) => (
              <div 
                key={entry.id}
                className="text-xs text-muted-foreground truncate"
              >
                • {entry.command}
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
