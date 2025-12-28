import { ExternalLink, Github, ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Project {
  title: string;
  description: string;
  technologies: string[];
  link: string;
  images?: string[];
  featured_image?: string;
}

interface PortfolioProjectsProps {
  title?: string;
  projects: Project[];
  onLinkClick?: (linkType: string, linkUrl: string) => void;
}

export function PortfolioProjects({ title = "Featured Projects", projects, onLinkClick }: PortfolioProjectsProps) {
  const featuredProject = projects[0];
  const otherProjects = projects.slice(1);

  const handleClick = (url: string) => {
    onLinkClick?.("project", url);
  };

  const formatUrl = (url: string) => url.startsWith("http") ? url : `https://${url}`;

  return (
    <section id="projects" className="py-24 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            A selection of my recent work and personal projects
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-purple-500 mx-auto rounded-full mt-4" />
        </div>

        {/* Featured Project */}
        {featuredProject && (
          <div className="mb-16">
            <div className="grid lg:grid-cols-2 gap-8 items-center p-8 rounded-3xl bg-card/50 border border-border/50">
              {/* Project Image */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-purple-500/20">
                {featuredProject.featured_image || (featuredProject.images && featuredProject.images[0]) ? (
                  <img 
                    src={featuredProject.featured_image || featuredProject.images![0]} 
                    alt={featuredProject.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-6xl font-bold gradient-text opacity-50">
                      {featuredProject.title.charAt(0)}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/80 via-transparent to-transparent" />
              </div>

              {/* Project Info */}
              <div className="space-y-6">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  Featured Project
                </div>
                <h3 className="text-3xl font-bold">{featuredProject.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{featuredProject.description}</p>
                
                <div className="flex flex-wrap gap-2">
                  {featuredProject.technologies.map((tech, i) => (
                    <span key={i} className="px-3 py-1 rounded-lg bg-secondary text-sm">
                      {tech}
                    </span>
                  ))}
                </div>

                {featuredProject.link && (
                  <Button asChild className="gap-2">
                    <a 
                      href={formatUrl(featuredProject.link)} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={() => handleClick(featuredProject.link)}
                    >
                      View Project <ArrowUpRight className="w-4 h-4" />
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other Projects Grid */}
        {otherProjects.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProjects.map((project, index) => (
              <div 
                key={index}
                className="group p-6 rounded-2xl bg-card/50 border border-border/50 hover:border-primary/50 transition-all duration-300"
              >
                {/* Project Image */}
                <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-purple-500/10 mb-4">
                  {project.featured_image || (project.images && project.images[0]) ? (
                    <img 
                      src={project.featured_image || project.images![0]} 
                      alt={project.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-4xl font-bold gradient-text opacity-30">
                        {project.title.charAt(0)}
                      </div>
                    </div>
                  )}
                </div>

                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                  {project.title}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                  {project.description}
                </p>

                <div className="flex flex-wrap gap-1 mb-4">
                  {project.technologies.slice(0, 3).map((tech, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-secondary/50 text-xs">
                      {tech}
                    </span>
                  ))}
                  {project.technologies.length > 3 && (
                    <span className="px-2 py-0.5 rounded bg-secondary/50 text-xs">
                      +{project.technologies.length - 3}
                    </span>
                  )}
                </div>

                {project.link && (
                  <a 
                    href={formatUrl(project.link)} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    onClick={() => handleClick(project.link)}
                    className="inline-flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    View Project <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
