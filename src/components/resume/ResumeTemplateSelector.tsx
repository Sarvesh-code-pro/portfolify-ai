import { Label } from "@/components/ui/label";

interface ResumeTemplateSelectorProps {
  currentTemplate: string;
  onSelect: (template: string) => void;
}

const templates = [
  {
    id: "classic",
    name: "Classic",
    description: "Traditional single-column layout with clean sections",
    preview: {
      headerStyle: "left-aligned",
      sectionStyle: "underlined",
      spacing: "comfortable",
    },
    features: ["Left-aligned header", "Underlined sections", "Traditional bullet points"],
  },
  {
    id: "modern",
    name: "Modern",
    description: "Clean design with accent color sidebar and icons",
    preview: {
      headerStyle: "centered",
      sectionStyle: "boxed",
      spacing: "compact",
    },
    features: ["Centered header", "Subtle borders", "Icon indicators"],
  },
  {
    id: "minimal",
    name: "Minimal",
    description: "Ultra-clean with maximum white space",
    preview: {
      headerStyle: "centered",
      sectionStyle: "simple",
      spacing: "spacious",
    },
    features: ["Maximum whitespace", "Simple dividers", "Clean typography"],
  },
  {
    id: "professional",
    name: "Professional",
    description: "Bold headers with structured sections for senior roles",
    preview: {
      headerStyle: "left-aligned",
      sectionStyle: "bold-header",
      spacing: "structured",
    },
    features: ["Bold section headers", "Clear hierarchy", "Structured layout"],
  },
  {
    id: "executive",
    name: "Executive",
    description: "Premium look with strategic use of emphasis",
    preview: {
      headerStyle: "centered",
      sectionStyle: "premium",
      spacing: "elegant",
    },
    features: ["Elegant typography", "Strategic emphasis", "Premium feel"],
  },
];

function TemplatePreview({ template }: { template: typeof templates[0] }) {
  const getPreviewStyles = () => {
    switch (template.id) {
      case "classic":
        return (
          <div className="space-y-2">
            <div className="h-4 w-24 bg-foreground/80 rounded-sm" />
            <div className="h-2 w-32 bg-muted-foreground/40 rounded-sm" />
            <div className="mt-3 border-b border-foreground/20 pb-1">
              <div className="h-2 w-16 bg-foreground/60 rounded-sm" />
            </div>
            <div className="space-y-1 pt-1">
              <div className="flex gap-1">
                <span className="text-[6px]">•</span>
                <div className="h-1.5 w-full bg-muted-foreground/30 rounded-sm" />
              </div>
              <div className="flex gap-1">
                <span className="text-[6px]">•</span>
                <div className="h-1.5 w-3/4 bg-muted-foreground/30 rounded-sm" />
              </div>
            </div>
          </div>
        );
      case "modern":
        return (
          <div className="space-y-2">
            <div className="text-center space-y-1">
              <div className="h-4 w-20 bg-primary/70 rounded-sm mx-auto" />
              <div className="h-1.5 w-28 bg-muted-foreground/40 rounded-sm mx-auto" />
            </div>
            <div className="mt-3 p-1.5 border border-primary/30 rounded">
              <div className="h-2 w-14 bg-primary/50 rounded-sm mb-1" />
              <div className="h-1.5 w-full bg-muted-foreground/30 rounded-sm" />
            </div>
          </div>
        );
      case "minimal":
        return (
          <div className="space-y-3">
            <div className="text-center">
              <div className="h-3 w-20 bg-foreground/70 rounded-sm mx-auto" />
              <div className="h-1 w-24 bg-muted-foreground/30 rounded-sm mx-auto mt-1.5" />
            </div>
            <div className="h-px bg-muted-foreground/20 w-full" />
            <div className="space-y-1">
              <div className="h-1.5 w-full bg-muted-foreground/20 rounded-sm" />
              <div className="h-1.5 w-5/6 bg-muted-foreground/20 rounded-sm" />
            </div>
          </div>
        );
      case "professional":
        return (
          <div className="space-y-2">
            <div className="space-y-0.5">
              <div className="h-4 w-24 bg-foreground rounded-sm" />
              <div className="h-1.5 w-20 bg-muted-foreground/50 rounded-sm" />
            </div>
            <div className="mt-2">
              <div className="h-2.5 w-16 bg-foreground/80 rounded-sm" />
              <div className="h-px bg-foreground/40 mt-0.5 mb-1.5" />
              <div className="h-1.5 w-full bg-muted-foreground/30 rounded-sm" />
            </div>
          </div>
        );
      case "executive":
        return (
          <div className="space-y-2">
            <div className="text-center space-y-1 py-1.5 border-y border-foreground/20">
              <div className="h-4 w-24 bg-foreground/80 rounded-sm mx-auto tracking-wide" style={{ letterSpacing: '0.1em' }} />
              <div className="h-1.5 w-20 bg-primary/50 rounded-sm mx-auto" />
            </div>
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <div className="h-1.5 w-1.5 rounded-full bg-primary/60" />
                <div className="h-2 w-14 bg-foreground/60 rounded-sm" />
              </div>
              <div className="h-1.5 w-full bg-muted-foreground/25 rounded-sm ml-2.5" />
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="w-20 h-28 bg-background border border-border rounded p-2 flex-shrink-0 shadow-sm">
      {getPreviewStyles()}
    </div>
  );
}

export function ResumeTemplateSelector({ currentTemplate, onSelect }: ResumeTemplateSelectorProps) {
  return (
    <div className="space-y-3">
      <Label>Resume Template</Label>
      <div className="grid grid-cols-1 gap-3">
        {templates.map((template) => {
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
              <TemplatePreview template={template} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium">{template.name}</span>
                  {isSelected && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                      Selected
                    </span>
                  )}
                </div>
                <p className="text-sm text-muted-foreground mb-2">
                  {template.description}
                </p>
                <div className="flex flex-wrap gap-1">
                  {template.features.map((feature, idx) => (
                    <span 
                      key={idx}
                      className="px-2 py-0.5 text-xs rounded-full bg-secondary text-muted-foreground"
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
      <p className="text-xs text-muted-foreground">
        All templates are ATS-optimized with single-column layouts and standard fonts.
      </p>
    </div>
  );
}
