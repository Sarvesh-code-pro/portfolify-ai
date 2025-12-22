import { Code, Palette, Briefcase } from "lucide-react";

const templates = [
  {
    role: "Developer",
    icon: Code,
    color: "developer",
    preview: "Technical focus with project showcases, tech stack displays, and GitHub integration.",
    features: ["Code snippets", "Project demos", "Tech stack badges"]
  },
  {
    role: "Designer",
    icon: Palette,
    color: "designer",
    preview: "Visual-first layout with large imagery, case study sections, and design process highlights.",
    features: ["Image galleries", "Case studies", "Process breakdowns"]
  },
  {
    role: "Product Manager",
    icon: Briefcase,
    color: "product-manager",
    preview: "Strategy-focused with impact metrics, product launches, and leadership highlights.",
    features: ["Metrics showcase", "Launch timelines", "Leadership stories"]
  }
];

export function TemplatesSection() {
  return (
    <section id="templates" className="py-24 relative">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Templates for every <span className="gradient-text">profession</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Role-specific designs that highlight what matters most to recruiters and clients.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {templates.map((template) => (
            <div 
              key={template.role}
              className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              {/* Template preview area */}
              <div className={`h-48 bg-gradient-to-br from-${template.color}/20 to-${template.color}/5 flex items-center justify-center relative`}>
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                                    linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }} />
                <template.icon className={`w-16 h-16 text-${template.color}`} />
              </div>
              
              {/* Content */}
              <div className="p-6">
                <h3 className="font-display text-2xl font-semibold mb-2">{template.role}</h3>
                <p className="text-muted-foreground mb-4">{template.preview}</p>
                
                <div className="flex flex-wrap gap-2">
                  {template.features.map((feature) => (
                    <span 
                      key={feature}
                      className="px-3 py-1 rounded-full bg-secondary text-sm text-secondary-foreground"
                    >
                      {feature}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
