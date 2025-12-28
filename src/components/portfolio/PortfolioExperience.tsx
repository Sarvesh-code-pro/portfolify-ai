import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Calendar, ChevronDown } from "lucide-react";
import { AnimatedSection } from "./AnimatedSection";
import { useState } from "react";

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
  logo_url?: string;
}

interface Education {
  institution?: string;
  degree?: string;
  field?: string;
  year?: string;
}

interface PortfolioExperienceProps {
  title?: string;
  experience: Experience[];
  education?: Education[];
  showEducation?: boolean;
}

function TimelineItem({ 
  item, 
  index, 
  type,
  isExpanded,
  onToggle
}: { 
  item: Experience; 
  index: number; 
  type: "work" | "education";
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const color = type === "work" ? "primary" : "purple-500";
  
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      whileInView={{ opacity: 1, x: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.5, delay: index * 0.1 }}
      className="relative pl-8 md:pl-12"
    >
      {/* Timeline dot */}
      <motion.div
        initial={{ scale: 0 }}
        whileInView={{ scale: 1 }}
        viewport={{ once: true }}
        transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
        className={`absolute left-0 top-0 w-4 h-4 rounded-full bg-${color} border-4 border-background z-10`}
        style={{ backgroundColor: type === "work" ? "hsl(var(--primary))" : "hsl(262 83% 58%)" }}
      />
      
      {/* Animated connecting line */}
      <motion.div
        initial={{ height: 0 }}
        whileInView={{ height: "100%" }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: index * 0.1 }}
        className="absolute left-[7px] top-4 w-0.5 bg-border"
      />

      <motion.div
        whileHover={{ x: 4 }}
        transition={{ duration: 0.2 }}
        onClick={onToggle}
        className="cursor-pointer group"
      >
        <div className="p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-primary/30 transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex items-start gap-4">
              {/* Company logo placeholder */}
              <div className="hidden md:flex w-12 h-12 rounded-xl bg-secondary/50 items-center justify-center shrink-0">
                {item.logo_url ? (
                  <img src={item.logo_url} alt={item.company} className="w-8 h-8 object-contain" />
                ) : (
                  <Briefcase className="w-5 h-5 text-muted-foreground" />
                )}
              </div>
              
              <div>
                <h4 className="text-lg font-semibold group-hover:text-primary transition-colors">
                  {item.role}
                </h4>
                <p className="text-primary text-sm font-medium">{item.company}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2 shrink-0">
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-secondary/50">
                <Calendar className="w-3 h-3" />
                {item.period}
              </span>
              <motion.div
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              </motion.div>
            </div>
          </div>

          {/* Expandable description */}
          <motion.div
            initial={false}
            animate={{ 
              height: isExpanded ? "auto" : 0,
              opacity: isExpanded ? 1 : 0
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <p className="text-sm text-muted-foreground leading-relaxed pt-2 border-t border-border/30 mt-3">
              {item.description}
            </p>
          </motion.div>
          
          {/* Preview text when collapsed */}
          {!isExpanded && item.description && (
            <p className="text-sm text-muted-foreground line-clamp-1 mt-2">
              {item.description}
            </p>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

export function PortfolioExperience({
  title = "Experience",
  experience,
  education = [],
  showEducation = true
}: PortfolioExperienceProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());

  const toggleItem = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <section id="experience" className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/20 to-transparent" />
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-gradient-to-r from-primary/10 to-transparent rounded-full blur-3xl -translate-y-1/2" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <span>💼</span>
            <span>Career Journey</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            My professional journey and growth over the years
          </p>
        </AnimatedSection>

        <div className="grid lg:grid-cols-2 gap-16">
          {/* Work Experience */}
          <div>
            <AnimatedSection className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="text-2xl font-semibold">Work Experience</h3>
                <p className="text-sm text-muted-foreground">{experience.length} positions</p>
              </div>
            </AnimatedSection>

            <div className="space-y-6 relative">
              {experience.map((exp, index) => (
                <TimelineItem
                  key={`work-${index}`}
                  item={exp}
                  index={index}
                  type="work"
                  isExpanded={expandedItems.has(`work-${index}`)}
                  onToggle={() => toggleItem(`work-${index}`)}
                />
              ))}
            </div>
          </div>

          {/* Education */}
          {showEducation && education.length > 0 && (
            <div>
              <AnimatedSection className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <GraduationCap className="w-6 h-6 text-purple-500" />
                </div>
                <div>
                  <h3 className="text-2xl font-semibold">Education</h3>
                  <p className="text-sm text-muted-foreground">{education.length} degrees</p>
                </div>
              </AnimatedSection>

              <div className="space-y-6 relative">
                {education.map((edu, index) => (
                  <motion.div
                    key={`edu-${index}`}
                    initial={{ opacity: 0, x: -30 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true, margin: "-100px" }}
                    transition={{ duration: 0.5, delay: index * 0.1 }}
                    className="relative pl-8 md:pl-12"
                  >
                    {/* Timeline dot */}
                    <motion.div
                      initial={{ scale: 0 }}
                      whileInView={{ scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: index * 0.1 + 0.2, type: "spring" }}
                      className="absolute left-0 top-0 w-4 h-4 rounded-full border-4 border-background z-10"
                      style={{ backgroundColor: "hsl(262 83% 58%)" }}
                    />
                    
                    {/* Connecting line */}
                    {index < education.length - 1 && (
                      <motion.div
                        initial={{ height: 0 }}
                        whileInView={{ height: "100%" }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        className="absolute left-[7px] top-4 w-0.5 bg-border"
                      />
                    )}

                    <motion.div
                      whileHover={{ x: 4 }}
                      transition={{ duration: 0.2 }}
                      className="p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-purple-500/30 transition-all duration-300 backdrop-blur-sm"
                    >
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <h4 className="text-lg font-semibold">{edu.degree}</h4>
                        {edu.year && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-3 py-1.5 rounded-full bg-secondary/50 shrink-0">
                            <Calendar className="w-3 h-3" />
                            {edu.year}
                          </span>
                        )}
                      </div>
                      <p className="text-purple-500 text-sm font-medium">{edu.institution}</p>
                      {edu.field && (
                        <p className="text-sm text-muted-foreground mt-1">{edu.field}</p>
                      )}
                    </motion.div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
