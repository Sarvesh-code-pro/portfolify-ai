import { motion } from "framer-motion";
import { Code, Palette, Lightbulb, Zap, Target, Users, Rocket, Heart } from "lucide-react";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./AnimatedSection";

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
    { title: "User Focus", description: "Building experiences that users love to interact with", icon: Heart },
  ],
  designer: [
    { title: "Visual Design", description: "Creating stunning visuals that capture attention", icon: Palette },
    { title: "User Experience", description: "Designing intuitive flows that delight users", icon: Lightbulb },
    { title: "Brand Identity", description: "Crafting cohesive brand experiences", icon: Target },
    { title: "Prototyping", description: "Bringing ideas to life with interactive prototypes", icon: Rocket },
  ],
  product_manager: [
    { title: "Strategy", description: "Developing comprehensive product roadmaps", icon: Target },
    { title: "Execution", description: "Delivering products that exceed expectations", icon: Rocket },
    { title: "Collaboration", description: "Working effectively across teams", icon: Users },
    { title: "Innovation", description: "Bringing fresh perspectives to every challenge", icon: Lightbulb },
  ],
  default: [
    { title: "Strategy", description: "Developing comprehensive solutions for complex challenges", icon: Lightbulb },
    { title: "Execution", description: "Delivering results that exceed expectations", icon: Rocket },
    { title: "Collaboration", description: "Working effectively across teams and disciplines", icon: Users },
    { title: "Innovation", description: "Bringing fresh perspectives to every project", icon: Target },
  ]
};

export function PortfolioAbout({ title = "About Me", aboutText, role = "developer" }: PortfolioAboutProps) {
  const highlights = roleHighlights[role] || roleHighlights.default;

  // Split about text into paragraphs for better formatting
  const paragraphs = aboutText.split('\n').filter(p => p.trim());

  return (
    <section id="about" className="py-32 px-6 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      <div className="absolute top-1/4 right-0 w-96 h-96 bg-gradient-to-l from-primary/5 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-1/4 left-0 w-96 h-96 bg-gradient-to-r from-purple-500/5 to-transparent rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <AnimatedSection className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <span>👋</span>
            <span>Introduction</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-purple-500 mx-auto rounded-full" />
        </AnimatedSection>

        {/* About Text with elegant typography */}
        <AnimatedSection delay={0.1} className="mb-20">
          <div className="max-w-4xl mx-auto">
            <div className="relative p-8 md:p-12 rounded-3xl bg-card/30 border border-border/30 backdrop-blur-sm">
              {/* Decorative quote marks */}
              <div className="absolute -top-4 -left-2 text-6xl text-primary/20 font-serif">"</div>
              <div className="absolute -bottom-8 -right-2 text-6xl text-primary/20 font-serif rotate-180">"</div>
              
              <div className="space-y-6 relative">
                {paragraphs.map((paragraph, index) => (
                  <motion.p
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.2 + index * 0.1 }}
                    className="text-lg md:text-xl text-muted-foreground leading-relaxed first-letter:text-3xl first-letter:font-bold first-letter:text-primary first-letter:mr-1"
                  >
                    {paragraph}
                  </motion.p>
                ))}
              </div>
            </div>
          </div>
        </AnimatedSection>

        {/* What I Bring Section */}
        <AnimatedSection delay={0.2} className="text-center mb-12">
          <h3 className="text-2xl md:text-3xl font-bold mb-4">What I Bring to the Table</h3>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Core strengths that I bring to every project
          </p>
        </AnimatedSection>

        {/* Highlights Grid with animations */}
        <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {highlights.map((highlight, index) => {
            const Icon = highlight.icon;
            return (
              <StaggerItem key={index}>
                <motion.div 
                  whileHover={{ y: -8, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300 }}
                  className="group h-full p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/50 transition-all duration-500 hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden"
                >
                  {/* Hover glow effect */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  />
                  
                  <div className="relative z-10">
                    <motion.div 
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.5 }}
                      className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors"
                    >
                      <Icon className="w-7 h-7 text-primary" />
                    </motion.div>
                    <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">{highlight.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{highlight.description}</p>
                  </div>
                </motion.div>
              </StaggerItem>
            );
          })}
        </StaggerContainer>

        {/* Fun Fact or Quote Section */}
        <AnimatedSection delay={0.4} className="mt-16">
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="text-center p-8 rounded-2xl bg-gradient-to-r from-primary/5 via-purple-500/5 to-primary/5 border border-border/30"
          >
            <motion.span
              animate={{ 
                scale: [1, 1.2, 1],
              }}
              transition={{ duration: 2, repeat: Infinity }}
              className="inline-block text-4xl mb-4"
            >
              ⚡
            </motion.span>
            <p className="text-lg text-muted-foreground italic">
              "I believe great work comes from the intersection of passion and purpose."
            </p>
          </motion.div>
        </AnimatedSection>
      </div>
    </section>
  );
}
