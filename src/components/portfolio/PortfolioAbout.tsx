import { Code, Palette, Lightbulb, Zap } from "lucide-react";

interface PortfolioAboutProps {
  title?: string;
  aboutText: string;
  role?: string;
}

const roleIcons: Record<string, typeof Code> = {
  developer: Code,
  designer: Palette,
  product_manager: Lightbulb,
  default: Zap
};

const roleHighlights: Record<string, { title: string; description: string; icon: typeof Code }[]> = {
  developer: [
    { title: "Clean Code", description: "Writing maintainable, scalable code that stands the test of time", icon: Code },
    { title: "Performance", description: "Optimizing for speed and efficiency in every project", icon: Zap },
    { title: "Innovation", description: "Staying ahead with modern technologies and best practices", icon: Lightbulb },
    { title: "User Focus", description: "Building experiences that users love to interact with", icon: Palette },
  ],
  designer: [
    { title: "Visual Design", description: "Creating stunning visuals that capture attention", icon: Palette },
    { title: "User Experience", description: "Designing intuitive flows that delight users", icon: Lightbulb },
    { title: "Brand Identity", description: "Crafting cohesive brand experiences", icon: Zap },
    { title: "Prototyping", description: "Bringing ideas to life with interactive prototypes", icon: Code },
  ],
  default: [
    { title: "Strategy", description: "Developing comprehensive solutions for complex challenges", icon: Lightbulb },
    { title: "Execution", description: "Delivering results that exceed expectations", icon: Zap },
    { title: "Collaboration", description: "Working effectively across teams and disciplines", icon: Palette },
    { title: "Innovation", description: "Bringing fresh perspectives to every project", icon: Code },
  ]
};

export function PortfolioAbout({ title = "Why Choose Me", aboutText, role = "developer" }: PortfolioAboutProps) {
  const highlights = roleHighlights[role] || roleHighlights.default;

  return (
    <section id="about" className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-purple-500 mx-auto rounded-full" />
        </div>

        {/* About Text */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <p className="text-lg text-muted-foreground leading-relaxed whitespace-pre-line">
            {aboutText}
          </p>
        </div>

        {/* Highlights Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <div 
                key={index}
                className="group p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{highlight.title}</h3>
                <p className="text-sm text-muted-foreground">{highlight.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
