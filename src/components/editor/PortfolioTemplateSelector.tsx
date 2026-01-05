import { Layout, Sparkles, Zap, Briefcase, Crown, Palette, Minimize } from "lucide-react";
import { Label } from "@/components/ui/label";

interface PortfolioTemplateSelectorProps {
  currentTemplate: string;
  onSelect: (template: string) => void;
}

const templates = [
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean with maximum whitespace and focus on content",
    icon: Minimize,
    features: ["Maximum whitespace", "Simple typography", "Content-focused"],
    heroStyle: "centered" as const,
    cardStyle: "borderless" as const,
  },
  {
    id: "bold",
    name: "Bold",
    description: "High-impact with dramatic typography and strong visuals",
    icon: Zap,
    features: ["Large typography", "Strong colors", "High contrast"],
    heroStyle: "fullwidth" as const,
    cardStyle: "solid" as const,
  },
  {
    id: "elegant",
    name: "Elegant",
    description: "Refined aesthetic with subtle animations and typography",
    icon: Crown,
    features: ["Serif headings", "Subtle animations", "Refined details"],
    heroStyle: "split" as const,
    cardStyle: "outlined" as const,
  },
  {
    id: "creative",
    name: "Creative",
    description: "Artsy layout perfect for designers and artists",
    icon: Palette,
    features: ["Asymmetric layout", "Creative spacing", "Visual focus"],
    heroStyle: "asymmetric" as const,
    cardStyle: "gradient" as const,
  },
  {
    id: "modern",
    name: "Modern",
    description: "Contemporary design with clean lines and subtle depth",
    icon: Sparkles,
    features: ["Glass effects", "Rounded corners", "Subtle shadows"],
    heroStyle: "centered" as const,
    cardStyle: "glass" as const,
  },
  {
    id: "professional",
    name: "Professional",
    description: "Corporate look ideal for business and enterprise roles",
    icon: Briefcase,
    features: ["Structured layout", "Traditional sections", "Clear hierarchy"],
    heroStyle: "left" as const,
    cardStyle: "bordered" as const,
  },
];

function TemplatePreview({ template }: { template: typeof templates[0] }) {
  const getPreviewStyles = () => {
    switch (template.id) {
      case "minimal":
        return (
          <div className="space-y-2 p-1">
            <div className="flex flex-col items-center gap-1">
              <div className="w-4 h-4 rounded-full bg-muted-foreground/30" />
              <div className="h-2 w-12 bg-foreground/60 rounded-sm" />
              <div className="h-1 w-14 bg-muted-foreground/30 rounded-sm" />
            </div>
            <div className="h-px bg-muted-foreground/10 w-full my-1" />
            <div className="space-y-1">
              <div className="h-1 w-full bg-muted-foreground/20 rounded-sm" />
              <div className="h-1 w-4/5 bg-muted-foreground/20 rounded-sm" />
            </div>
          </div>
        );
      case "bold":
        return (
          <div className="space-y-1.5">
            <div className="h-8 bg-foreground/90 rounded-t flex items-end p-1">
              <div className="h-3 w-12 bg-background/80 rounded-sm" />
            </div>
            <div className="flex gap-1 px-1">
              <div className="h-4 w-4 rounded bg-primary/60" />
              <div className="h-4 w-4 rounded bg-primary/40" />
              <div className="h-4 w-4 rounded bg-primary/20" />
            </div>
          </div>
        );
      case "elegant":
        return (
          <div className="space-y-1.5 p-1">
            <div className="flex gap-2">
              <div className="flex-1 space-y-1">
                <div className="h-2 w-8 bg-foreground/70 rounded-sm" style={{ fontFamily: 'serif' }} />
                <div className="h-1 w-12 bg-muted-foreground/30 rounded-sm" />
              </div>
              <div className="w-6 h-6 rounded-full bg-muted-foreground/20" />
            </div>
            <div className="border border-foreground/10 rounded p-1 space-y-0.5">
              <div className="h-1 w-full bg-muted-foreground/15 rounded-sm" />
              <div className="h-1 w-3/4 bg-muted-foreground/15 rounded-sm" />
            </div>
          </div>
        );
      case "creative":
        return (
          <div className="relative p-1">
            <div className="absolute top-1 right-1 w-8 h-8 rounded-lg bg-primary/20 rotate-12" />
            <div className="relative z-10 space-y-1">
              <div className="h-2 w-10 bg-foreground/80 rounded-sm" />
              <div className="flex gap-1">
                <div className="h-3 w-3 rounded-full bg-muted-foreground/30" />
                <div className="h-3 w-3 rounded-full bg-primary/40" />
              </div>
              <div className="grid grid-cols-2 gap-0.5">
                <div className="h-3 rounded bg-muted-foreground/10" />
                <div className="h-4 rounded bg-muted-foreground/15 -mt-1" />
              </div>
            </div>
          </div>
        );
      case "modern":
        return (
          <div className="space-y-1.5 p-1">
            <div className="flex flex-col items-center gap-0.5">
              <div className="w-5 h-5 rounded-full bg-gradient-to-br from-primary/40 to-primary/20" />
              <div className="h-2 w-10 bg-foreground/70 rounded" />
            </div>
            <div className="flex gap-1">
              <div className="flex-1 h-5 rounded-lg bg-muted-foreground/10 backdrop-blur p-0.5">
                <div className="h-1 w-3/4 bg-muted-foreground/30 rounded" />
              </div>
              <div className="flex-1 h-5 rounded-lg bg-muted-foreground/10 backdrop-blur p-0.5">
                <div className="h-1 w-2/3 bg-muted-foreground/30 rounded" />
              </div>
            </div>
          </div>
        );
      case "professional":
        return (
          <div className="space-y-1 p-1">
            <div className="flex items-center gap-1 pb-1 border-b border-foreground/20">
              <div className="h-2 w-8 bg-foreground/80 rounded-sm" />
              <div className="flex-1" />
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
              <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            </div>
            <div className="grid grid-cols-3 gap-0.5">
              <div className="col-span-2 space-y-0.5">
                <div className="h-1 w-full bg-muted-foreground/20 rounded-sm" />
                <div className="h-1 w-5/6 bg-muted-foreground/20 rounded-sm" />
              </div>
              <div className="h-4 bg-muted-foreground/10 rounded" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-16 h-20 bg-background border border-border rounded overflow-hidden flex-shrink-0 shadow-sm">
      {getPreviewStyles()}
    </div>
  );
}

export function PortfolioTemplateSelector({ currentTemplate, onSelect }: PortfolioTemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Portfolio Template</Label>
      <div className="grid grid-cols-1 gap-2">
        {templates.map((template) => {
          const Icon = template.icon;
          const isSelected = currentTemplate === template.id;
          
          return (
            <button
              key={template.id}
              onClick={() => onSelect(template.id)}
              className={`flex items-start gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                isSelected
                  ? "border-primary bg-primary/5"
                  : "border-border hover:border-primary/30 hover:bg-secondary/30"
              }`}
            >
              <TemplatePreview template={template} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <span className="font-medium text-sm">{template.name}</span>
                  {isSelected && (
                    <span className="px-1.5 py-0.5 text-xs rounded bg-primary text-primary-foreground">
                      Active
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mb-1.5 line-clamp-1">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.features.slice(0, 2).map((feature, idx) => (
                    <span 
                      key={idx}
                      className="px-1.5 py-0.5 text-[10px] rounded bg-secondary text-muted-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
