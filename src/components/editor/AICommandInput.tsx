import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Sparkles, 
  Loader2, 
  Undo2, 
  Redo2, 
  X,
  ChevronDown,
  Type,
  FileText,
  Briefcase
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface EditHistoryEntry {
  id: string;
  timestamp: Date;
  command: string;
  scope: EditScope;
  section?: SectionType;
  beforePatch: Record<string, any>;
  afterPatch: Record<string, any>;
}

interface AICommandInputProps {
  portfolio: {
    id: string;
    role: string;
    hero_title?: string | null;
    hero_subtitle?: string | null;
    about_text?: string | null;
    skills?: string[];
    projects?: any[];
    experience?: any[];
  };
  onUpdate: (updates: Record<string, any>) => void;
  onSave: () => Promise<void>;
}

type EditScope = "selection" | "section" | "portfolio";
type SectionType = "about" | "experience" | "skills" | "projects" | "hero";

const QUICK_COMMANDS = [
  "Make more concise",
  "Improve professionalism",
  "Add more action verbs",
  "Quantify achievements",
  "Rewrite for tech role",
  "Rewrite for PM role",
  "Make more engaging",
];

export function AICommandInput({ portfolio, onUpdate, onSave }: AICommandInputProps) {
  const [command, setCommand] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [scope, setScope] = useState<EditScope>("section");
  const [selectedSection, setSelectedSection] = useState<SectionType>("about");
  const [history, setHistory] = useState<EditHistoryEntry[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [isExpanded, setIsExpanded] = useState(false);
  const { toast } = useToast();

  const getSectionContent = (section: SectionType): string => {
    switch (section) {
      case "about":
        return portfolio.about_text || "";
      case "hero":
        return `${portfolio.hero_title || ""}\n${portfolio.hero_subtitle || ""}`;
      case "skills":
        return (portfolio.skills || []).join(", ");
      case "experience":
        return (portfolio.experience || [])
          .map(e => `${e.role} at ${e.company} (${e.period})\n${e.description}`)
          .join("\n\n");
      case "projects":
        return (portfolio.projects || [])
          .map(p => `${p.title}\n${p.description}\nTechnologies: ${p.technologies?.join(", ")}`)
          .join("\n\n");
      default:
        return "";
    }
  };

  const parseSkillsText = (text: string): string[] => {
    const raw = (text ?? "").trim();
    if (!raw) return [];

    // JSON array (sometimes models respond with ["A", "B"])
    if (raw.startsWith("[") && raw.endsWith("]")) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.map((s) => String(s).trim()).filter(Boolean);
        }
      } catch {
        // fall through
      }
    }

    // Bullet/newline list
    if (raw.includes("\n")) {
      const lines = raw
        .split("\n")
        .map((l) => l.replace(/^\s*[-*•]+\s*/, "").trim())
        .filter(Boolean);
      if (lines.length >= 2) return lines;
    }

    // Comma-separated
    return raw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const applySectionUpdate = (section: SectionType, content: string) => {
    switch (section) {
      case "about":
        return { about_text: content };
      case "hero": {
        const cleaned = content
          .split("\n")
          .map((l) => l.trim())
          .filter(Boolean)
          .map((l) =>
            l
              .replace(/^(hero\s*)?title\s*:\s*/i, "")
              .replace(/^(hero\s*)?subtitle\s*:\s*/i, "")
              .trim()
          );

        return {
          hero_title: cleaned[0] || portfolio.hero_title,
          hero_subtitle: cleaned[1] || portfolio.hero_subtitle,
        };
      }
      case "skills":
        return { skills: parseSkillsText(content) };
      case "experience":
        // Parse experience back - this is complex, so we handle it carefully
        const expBlocks = content.split("\n\n").filter(b => b.trim());
        const updatedExp = expBlocks.map((block, idx) => {
          const existing = portfolio.experience?.[idx];
          const lines = block.split("\n");
          const headerMatch = lines[0]?.match(/^(.+?) at (.+?) \((.+?)\)$/);
          if (headerMatch) {
            return {
              role: headerMatch[1],
              company: headerMatch[2],
              period: headerMatch[3],
              description: lines.slice(1).join("\n").trim()
            };
          }
          return existing || { role: "", company: "", period: "", description: block };
        });
        return { experience: updatedExp };
      case "projects":
        // Parse projects back
        const projBlocks = content.split("\n\n").filter(b => b.trim());
        const updatedProj = projBlocks.map((block, idx) => {
          const existing = portfolio.projects?.[idx];
          const lines = block.split("\n");
          const techLine = lines.find(l => l.startsWith("Technologies:"));
          const technologies = techLine 
            ? techLine.replace("Technologies:", "").split(",").map(t => t.trim()).filter(Boolean)
            : existing?.technologies || [];
          return {
            title: lines[0] || existing?.title || "",
            description: lines.filter(l => !l.startsWith("Technologies:")).slice(1).join("\n").trim() || existing?.description || "",
            technologies,
            link: existing?.link || ""
          };
        });
        return { projects: updatedProj };
      default:
        return {};
    }
  };

  const executeCommand = useCallback(async (cmd: string) => {
    if (!cmd.trim()) {
      toast({ title: "Please enter a command", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    
    try {
      const content = scope === "portfolio" 
        ? JSON.stringify({
            hero_title: portfolio.hero_title,
            hero_subtitle: portfolio.hero_subtitle,
            about_text: portfolio.about_text,
            skills: portfolio.skills,
            experience: portfolio.experience,
            projects: portfolio.projects
          }, null, 2)
        : getSectionContent(selectedSection);

      if (!content.trim()) {
        toast({ title: "Selected section is empty", variant: "destructive" });
        setIsProcessing(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke("ai-edit-content", {
        body: {
          command: cmd,
          content,
          scope,
          sectionType: scope === "section" ? selectedSection : undefined,
          context: { role: portfolio.role }
        }
      });

      if (error) throw error;

      if (!data?.editedContent && !data?.updates) {
        throw new Error("No edited content returned");
      }

      const beforeSnapshot = {
        hero_title: portfolio.hero_title,
        hero_subtitle: portfolio.hero_subtitle,
        about_text: portfolio.about_text,
        skills: portfolio.skills,
        experience: portfolio.experience,
        projects: portfolio.projects,
      };

      let historyEntry: EditHistoryEntry;

      // Apply the update
      if (scope === "portfolio") {
        // Handle structured patch response from tool calling
        let updates: Record<string, any>;
        
        if (data?.isStructuredPatch && data?.patchData) {
          // New structured response format
          updates = data.patchData;
        } else if (data?.updates && typeof data.updates === "object") {
          // Legacy updates format
          updates = data.updates;
        } else {
          // Fallback: try to parse editedContent as JSON
          try {
            updates = JSON.parse(String(data.editedContent));
          } catch {
            throw new Error(
              "AI returned an unexpected format for a full-portfolio edit. Try editing a specific section instead."
            );
          }
        }

        const afterSnapshot = { ...beforeSnapshot, ...updates };

        historyEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          command: cmd,
          scope,
          beforePatch: beforeSnapshot,
          afterPatch: afterSnapshot,
        };

        onUpdate(updates);
      } else {
        const beforePatch = applySectionUpdate(selectedSection, content);
        const afterPatch = applySectionUpdate(selectedSection, String(data.editedContent));

        historyEntry = {
          id: crypto.randomUUID(),
          timestamp: new Date(),
          command: cmd,
          scope,
          section: selectedSection,
          beforePatch,
          afterPatch,
        };

        onUpdate(afterPatch);
      }

      // Update history
      setHistory(prev => [...prev.slice(0, historyIndex + 1), historyEntry]);
      setHistoryIndex(prev => prev + 1);

      setCommand("");

      toast({ 
        title: "Content updated", 
        description: `Applied: "${cmd}"` 
      });

      // Auto-save after AI edit
      await onSave();
    } catch (error: any) {
      console.error("AI edit error:", error);
      toast({ 
        title: "Edit failed", 
        description: error.message || "Could not apply AI edit",
        variant: "destructive" 
      });
    } finally {
      setIsProcessing(false);
    }
  }, [scope, selectedSection, portfolio, onUpdate, onSave, historyIndex, toast]);

  const undo = useCallback(() => {
    if (historyIndex < 0) return;

    const entry = history[historyIndex];
    onUpdate(entry.beforePatch);
    setHistoryIndex((prev) => prev - 1);

    toast({ title: "Undone", description: `Reverted: "${entry.command}"` });
  }, [history, historyIndex, onUpdate, toast]);

  const redo = useCallback(() => {
    if (historyIndex >= history.length - 1) return;

    const entry = history[historyIndex + 1];
    onUpdate(entry.afterPatch);
    setHistoryIndex((prev) => prev + 1);

    toast({ title: "Redone", description: `Re-applied: "${entry.command}"` });
  }, [history, historyIndex, onUpdate, toast]);

  const canUndo = historyIndex >= 0;
  const canRedo = historyIndex < history.length - 1;

  if (!isExpanded) {
    return (
      <Button 
        variant="outline" 
        size="sm" 
        onClick={() => setIsExpanded(true)}
        className="gap-2"
      >
        <Sparkles className="w-4 h-4" />
        AI Edit
      </Button>
    );
  }

  return (
    <div className="bg-card border border-border rounded-lg p-4 space-y-3 animate-scale-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">AI Content Editor</span>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={undo}
                  disabled={!canUndo || isProcessing}
                >
                  <Undo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Undo last AI edit</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7" 
                  onClick={redo}
                  disabled={!canRedo || isProcessing}
                >
                  <Redo2 className="w-3.5 h-3.5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Redo AI edit</TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-7 w-7"
            onClick={() => setIsExpanded(false)}
          >
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Scope selector */}
      <div className="flex gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-8 gap-1.5">
              {scope === "section" ? (
                <>
                  <FileText className="w-3.5 h-3.5" />
                  {selectedSection.charAt(0).toUpperCase() + selectedSection.slice(1)}
                </>
              ) : (
                <>
                  <Briefcase className="w-3.5 h-3.5" />
                  Entire Portfolio
                </>
              )}
              <ChevronDown className="w-3 h-3 opacity-50" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuItem onClick={() => { setScope("section"); setSelectedSection("about"); }}>
              <Type className="w-4 h-4 mr-2" /> About Section
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setScope("section"); setSelectedSection("hero"); }}>
              <Type className="w-4 h-4 mr-2" /> Hero Section
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setScope("section"); setSelectedSection("experience"); }}>
              <Briefcase className="w-4 h-4 mr-2" /> Experience Section
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setScope("section"); setSelectedSection("skills"); }}>
              <FileText className="w-4 h-4 mr-2" /> Skills Section
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setScope("section"); setSelectedSection("projects"); }}>
              <FileText className="w-4 h-4 mr-2" /> Projects Section
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setScope("portfolio")}>
              <Briefcase className="w-4 h-4 mr-2" /> Entire Portfolio
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {history.length > 0 && (
          <span className="text-xs text-muted-foreground self-center">
            {history.length} edit{history.length !== 1 ? "s" : ""} in history
          </span>
        )}
      </div>

      {/* Command input */}
      <div className="flex gap-2">
        <Input
          placeholder='e.g., "Make more concise" or "Rewrite for PM role"'
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !isProcessing) {
              executeCommand(command);
            }
          }}
          disabled={isProcessing}
          className="h-9"
        />
        <Button 
          size="sm" 
          onClick={() => executeCommand(command)}
          disabled={isProcessing || !command.trim()}
          className="h-9 px-4"
        >
          {isProcessing ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
        </Button>
      </div>

      {/* Quick commands */}
      <div className="flex flex-wrap gap-1.5">
        {QUICK_COMMANDS.map((qc) => (
          <Button
            key={qc}
            variant="ghost"
            size="sm"
            className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => executeCommand(qc)}
            disabled={isProcessing}
          >
            {qc}
          </Button>
        ))}
      </div>
    </div>
  );
}
