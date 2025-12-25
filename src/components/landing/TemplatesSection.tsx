import { 
  Code, Palette, Briefcase, Database, Server, Bug, Shield, Smartphone, 
  Search, PenTool, Megaphone, Layers, BarChart3, FolderKanban, Users, LineChart 
} from "lucide-react";

const templates = [
  // Tech
  { role: "Developer", icon: Code, preview: "Technical focus with project showcases, tech stack displays, and GitHub integration.", features: ["Code snippets", "Project demos", "Tech stack badges"] },
  { role: "Data Scientist", icon: Database, preview: "ML models, Jupyter notebooks, analytics dashboards, and research publications.", features: ["Model metrics", "Data viz", "Research papers"] },
  { role: "DevOps Engineer", icon: Server, preview: "Infrastructure diagrams, CI/CD pipelines, and system architecture documentation.", features: ["Architecture diagrams", "Deployment stats", "Tool proficiency"] },
  { role: "QA Engineer", icon: Bug, preview: "Testing frameworks, automation coverage, and quality metrics dashboards.", features: ["Test coverage", "Bug reports", "Automation scripts"] },
  { role: "Security Engineer", icon: Shield, preview: "Security audits, vulnerability assessments, and compliance certifications.", features: ["Audit reports", "Certifications", "Threat analysis"] },
  { role: "Mobile Developer", icon: Smartphone, preview: "App showcases with screenshots, download stats, and platform expertise.", features: ["App screenshots", "Store ratings", "Platform skills"] },
  // Creative
  { role: "Designer", icon: Palette, preview: "Visual-first layout with large imagery, case study sections, and design process highlights.", features: ["Image galleries", "Case studies", "Process breakdowns"] },
  { role: "UX Researcher", icon: Search, preview: "Research methodologies, user insights, and data-driven recommendations.", features: ["Research methods", "User insights", "Personas"] },
  { role: "Content Writer", icon: PenTool, preview: "Writing portfolio with samples, publication credits, and content strategy.", features: ["Writing samples", "Publication list", "Content metrics"] },
  { role: "Marketing Manager", icon: Megaphone, preview: "Campaign results, growth metrics, and brand strategy documentation.", features: ["Campaign ROI", "Growth charts", "Brand work"] },
  { role: "Brand Designer", icon: Layers, preview: "Brand identities, style guides, and visual system documentation.", features: ["Brand guidelines", "Logo systems", "Color palettes"] },
  // Business
  { role: "Product Manager", icon: Briefcase, preview: "Strategy-focused with impact metrics, product launches, and leadership highlights.", features: ["Metrics showcase", "Launch timelines", "Leadership stories"] },
  { role: "Business Analyst", icon: BarChart3, preview: "Analysis projects, process improvements, and business insights.", features: ["Analysis reports", "Process flows", "Data insights"] },
  { role: "Project Manager", icon: FolderKanban, preview: "Project deliveries, Gantt charts, and team leadership highlights.", features: ["Project timelines", "Team metrics", "Methodology"] },
  { role: "Sales Engineer", icon: Users, preview: "Technical demos, client solutions, and deal success stories.", features: ["Demo videos", "Client wins", "Solution designs"] },
  { role: "Consultant", icon: LineChart, preview: "Client engagements, strategy frameworks, and business impact metrics.", features: ["Case studies", "Frameworks", "Impact metrics"] },
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

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {templates.map((template) => (
            <div 
              key={template.role}
              className="group relative rounded-2xl overflow-hidden bg-card border border-border/50 hover:border-primary/30 transition-all duration-300"
            >
              {/* Template preview area */}
              <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center relative">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px),
                                    linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
                  backgroundSize: '24px 24px'
                }} />
                <template.icon className="w-12 h-12 text-primary" />
              </div>
              
              {/* Content */}
              <div className="p-4">
                <h3 className="font-display text-lg font-semibold mb-1">{template.role}</h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">{template.preview}</p>
                
                <div className="flex flex-wrap gap-1.5">
                  {template.features.map((feature) => (
                    <span 
                      key={feature}
                      className="px-2 py-0.5 rounded-full bg-secondary text-xs text-secondary-foreground"
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
