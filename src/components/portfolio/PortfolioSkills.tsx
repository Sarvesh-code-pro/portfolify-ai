import { motion } from "framer-motion";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./AnimatedSection";
import { useState } from "react";

interface PortfolioSkillsProps {
  title?: string;
  skills: string[];
}

// Enhanced skill category detection with icons
const skillCategories: Record<string, { keywords: string[]; color: string; gradient: string }> = {
  "Frontend": {
    keywords: ["react", "vue", "angular", "javascript", "typescript", "html", "css", "tailwind", "next.js", "gatsby", "svelte", "sass", "scss"],
    color: "hsl(217 91% 60%)",
    gradient: "from-blue-500 to-cyan-400",
  },
  "Backend": {
    keywords: ["node", "python", "java", "go", "rust", "php", "ruby", "c#", ".net", "django", "flask", "express", "fastapi", "spring"],
    color: "hsl(142 71% 45%)",
    gradient: "from-green-500 to-emerald-400",
  },
  "Database": {
    keywords: ["postgresql", "mysql", "mongodb", "redis", "firebase", "supabase", "dynamodb", "sqlite", "graphql", "prisma"],
    color: "hsl(262 83% 58%)",
    gradient: "from-purple-500 to-pink-400",
  },
  "DevOps & Cloud": {
    keywords: ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "github actions", "jenkins", "terraform", "vercel", "netlify"],
    color: "hsl(32 95% 55%)",
    gradient: "from-orange-500 to-amber-400",
  },
  "Design": {
    keywords: ["figma", "sketch", "adobe xd", "photoshop", "illustrator", "ui/ux", "prototyping", "design", "wireframe"],
    color: "hsl(328 85% 60%)",
    gradient: "from-pink-500 to-rose-400",
  },
  "Mobile": {
    keywords: ["react native", "flutter", "swift", "kotlin", "ios", "android", "expo"],
    color: "hsl(185 84% 50%)",
    gradient: "from-cyan-500 to-teal-400",
  },
};

function categorizeSkill(skill: string): string {
  const lowerSkill = skill.toLowerCase();
  for (const [category, config] of Object.entries(skillCategories)) {
    if (config.keywords.some(keyword => lowerSkill.includes(keyword))) {
      return category;
    }
  }
  return "Other";
}

function getCategoryConfig(category: string) {
  return skillCategories[category] || { 
    color: "hsl(var(--muted-foreground))", 
    gradient: "from-gray-500 to-slate-400" 
  };
}

export function PortfolioSkills({ title = "Skills & Expertise", skills }: PortfolioSkillsProps) {
  const [hoveredSkill, setHoveredSkill] = useState<string | null>(null);

  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = categorizeSkill(skill);
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, string[]>);

  const categories = Object.entries(groupedSkills);

  return (
    <section id="skills" className="py-32 px-6 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-card/20 to-background" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-primary/5 to-transparent rounded-full blur-3xl" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <span>💻</span>
            <span>Tech Stack</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Technologies and tools I use to bring ideas to life
          </p>
        </AnimatedSection>

        {/* Skills by Category */}
        <div className="space-y-12">
          {categories.map(([category, categorySkills], catIndex) => {
            const config = getCategoryConfig(category);
            
            return (
              <AnimatedSection key={category} delay={catIndex * 0.1}>
                <div className="mb-6 flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: config.color }}
                  />
                  <h3 className="text-xl font-semibold">{category}</h3>
                  <div className="flex-1 h-px bg-border/50" />
                  <span className="text-sm text-muted-foreground">{categorySkills.length} skills</span>
                </div>
                
                <StaggerContainer className="flex flex-wrap gap-3">
                  {categorySkills.map((skill, index) => (
                    <StaggerItem key={skill}>
                      <motion.div
                        onHoverStart={() => setHoveredSkill(skill)}
                        onHoverEnd={() => setHoveredSkill(null)}
                        whileHover={{ 
                          scale: 1.05, 
                          y: -4,
                        }}
                        whileTap={{ scale: 0.98 }}
                        className="relative group"
                      >
                        {/* Glow effect on hover */}
                        <motion.div
                          className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
                          style={{ 
                            background: `linear-gradient(135deg, ${config.color}33, transparent)` 
                          }}
                        />
                        
                        <div 
                          className="relative px-5 py-3 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300 cursor-default backdrop-blur-sm"
                          style={{
                            borderColor: hoveredSkill === skill ? config.color : undefined,
                          }}
                        >
                          <span className="text-sm font-medium">{skill}</span>
                        </div>
                      </motion.div>
                    </StaggerItem>
                  ))}
                </StaggerContainer>
              </AnimatedSection>
            );
          })}
        </div>

        {/* Skills visualization */}
        <AnimatedSection delay={0.5} className="mt-16">
          <div className="p-8 rounded-3xl bg-card/30 border border-border/30 backdrop-blur-sm">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.slice(0, 6).map(([category, categorySkills], index) => {
                const config = getCategoryConfig(category);
                const percentage = Math.min((categorySkills.length / skills.length) * 100 * 3, 100);
                
                return (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.6 + index * 0.1 }}
                    className="text-center"
                  >
                    <div className="relative w-20 h-20 mx-auto mb-3">
                      <svg className="w-full h-full -rotate-90">
                        <circle
                          cx="40"
                          cy="40"
                          r="36"
                          fill="none"
                          stroke="hsl(var(--border))"
                          strokeWidth="4"
                        />
                        <motion.circle
                          cx="40"
                          cy="40"
                          r="36"
                          fill="none"
                          stroke={config.color}
                          strokeWidth="4"
                          strokeLinecap="round"
                          strokeDasharray={`${226.2}`}
                          initial={{ strokeDashoffset: 226.2 }}
                          whileInView={{ strokeDashoffset: 226.2 - (226.2 * percentage / 100) }}
                          viewport={{ once: true }}
                          transition={{ duration: 1, delay: 0.8 + index * 0.1 }}
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-sm font-bold">{categorySkills.length}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{category}</p>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
}
