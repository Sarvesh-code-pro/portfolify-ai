interface PortfolioSkillsProps {
  title?: string;
  skills: string[];
}

// Skill category detection
const skillCategories: Record<string, string[]> = {
  "Frontend": ["react", "vue", "angular", "javascript", "typescript", "html", "css", "tailwind", "next.js", "gatsby", "svelte"],
  "Backend": ["node", "python", "java", "go", "rust", "php", "ruby", "c#", ".net", "django", "flask", "express", "fastapi"],
  "Database": ["postgresql", "mysql", "mongodb", "redis", "firebase", "supabase", "dynamodb", "sqlite"],
  "DevOps": ["docker", "kubernetes", "aws", "gcp", "azure", "ci/cd", "github actions", "jenkins", "terraform"],
  "Design": ["figma", "sketch", "adobe xd", "photoshop", "illustrator", "ui/ux", "prototyping"],
  "Mobile": ["react native", "flutter", "swift", "kotlin", "ios", "android"],
};

function categorizeSkill(skill: string): string {
  const lowerSkill = skill.toLowerCase();
  for (const [category, keywords] of Object.entries(skillCategories)) {
    if (keywords.some(keyword => lowerSkill.includes(keyword))) {
      return category;
    }
  }
  return "Other";
}

export function PortfolioSkills({ title = "Skills & Expertise", skills }: PortfolioSkillsProps) {
  // Group skills by category
  const groupedSkills = skills.reduce((acc, skill) => {
    const category = categorizeSkill(skill);
    if (!acc[category]) acc[category] = [];
    acc[category].push(skill);
    return acc;
  }, {} as Record<string, string[]>);

  const categories = Object.entries(groupedSkills);

  return (
    <section id="skills" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Technologies and tools I use to bring ideas to life
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-purple-500 mx-auto rounded-full mt-4" />
        </div>

        {/* Skills by Category */}
        {categories.length > 1 ? (
          <div className="space-y-10">
            {categories.map(([category, categorySkills]) => (
              <div key={category}>
                <h3 className="text-lg font-semibold text-primary mb-4">{category}</h3>
                <div className="flex flex-wrap gap-3">
                  {categorySkills.map((skill, index) => (
                    <span
                      key={index}
                      className="px-4 py-2 rounded-xl bg-card border border-border/50 text-sm font-medium hover:border-primary/50 hover:bg-primary/5 transition-all cursor-default"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Flat list if only one category */
          <div className="flex flex-wrap justify-center gap-3">
            {skills.map((skill, index) => (
              <span
                key={index}
                className="px-5 py-3 rounded-xl bg-card border border-border/50 text-sm font-medium hover:border-primary/50 hover:bg-primary/5 transition-all cursor-default"
              >
                {skill}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
