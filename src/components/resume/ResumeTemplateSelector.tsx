import { Label } from "@/components/ui/label";
import { FileText, Briefcase, Sparkles, Zap, Crown } from "lucide-react";

interface ResumeTemplateSelectorProps {
  currentTemplate: string;
  onSelect: (template: string) => void;
}

const templates = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional layout, perfect for conservative industries",
    icon: FileText,
    color: "text-blue-500",
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean design with subtle accents",
    icon: Sparkles,
    color: "text-purple-500",
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean, maximum content focus",
    icon: Zap,
    color: "text-green-500",
  },
  {
    id: "professional",
    name: "Professional",
    description: "Polished look for senior roles",
    icon: Briefcase,
    color: "text-amber-500",
  },
  {
    id: "executive",
    name: "Executive",
    description: "Premium design for leadership positions",
    icon: Crown,
    color: "text-rose-500",
  },
];

export function ResumeTemplateSelector({ currentTemplate, onSelect }: ResumeTemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Resume Template</Label>
      <div className="grid grid-cols-1 gap-3">
        {templates.map((template) => {
          const Icon = template.icon;
          const isSelected = currentTemplate === template.id;
          
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-secondary/30"
              }`}
            >
              <div className={`p-2 rounded-lg bg-secondary ${template.color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{template.name}</span>
                  {isSelected && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {template.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        All templates are ATS-optimized with single-column layouts and standard fonts.
      </p>
    </div>
  );
}
