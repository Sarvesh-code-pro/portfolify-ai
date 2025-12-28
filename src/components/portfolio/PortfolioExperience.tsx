import { Briefcase, GraduationCap, Calendar } from "lucide-react";

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
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

export function PortfolioExperience({ 
  title = "Experience", 
  experience, 
  education = [],
  showEducation = true 
}: PortfolioExperienceProps) {
  return (
    <section id="experience" className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/30 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            My professional journey and growth
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-purple-500 mx-auto rounded-full mt-4" />
        </div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Work Experience */}
          <div>
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold">Work Experience</h3>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

              <div className="space-y-8">
                {experience.map((exp, index) => (
                  <div key={index} className="relative pl-12">
                    {/* Timeline dot */}
                    <div className="absolute left-[12px] top-2 w-4 h-4 rounded-full bg-primary border-4 border-background" />
                    
                    <div className="p-5 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/30 transition-colors">
                      <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                        <h4 className="text-lg font-semibold">{exp.role}</h4>
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
                          <Calendar className="w-3 h-3" />
                          {exp.period}
                        </span>
                      </div>
                      <p className="text-primary text-sm mb-3">{exp.company}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed">{exp.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Education */}
          {showEducation && education.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-purple-500" />
                </div>
                <h3 className="text-2xl font-semibold">Education</h3>
              </div>

              <div className="relative">
                {/* Timeline line */}
                <div className="absolute left-[19px] top-2 bottom-2 w-0.5 bg-border" />

                <div className="space-y-8">
                  {education.map((edu, index) => (
                    <div key={index} className="relative pl-12">
                      {/* Timeline dot */}
                      <div className="absolute left-[12px] top-2 w-4 h-4 rounded-full bg-purple-500 border-4 border-background" />
                      
                      <div className="p-5 rounded-2xl bg-card/50 border border-border/50 hover:border-purple-500/30 transition-colors">
                        <div className="flex items-start justify-between flex-wrap gap-2 mb-2">
                          <h4 className="text-lg font-semibold">{edu.degree}</h4>
                          {edu.year && (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground px-2 py-1 rounded-full bg-secondary/50">
                              <Calendar className="w-3 h-3" />
                              {edu.year}
                            </span>
                          )}
                        </div>
                        <p className="text-purple-500 text-sm mb-1">{edu.institution}</p>
                        {edu.field && (
                          <p className="text-sm text-muted-foreground">{edu.field}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
