import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, Github, ArrowUpRight, X, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatedSection, StaggerContainer, StaggerItem } from "./AnimatedSection";
import { useState } from "react";

interface Project {
  title: string;
  description: string;
  technologies: string[];
  link: string;
  images?: string[];
  featured_image?: string;
  github_link?: string;
}

interface PortfolioProjectsProps {
  title?: string;
  projects: Project[];
  onLinkClick?: (linkType: string, linkUrl: string) => void;
}

interface ProjectModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onLinkClick?: (linkType: string, linkUrl: string) => void;
}

function ProjectModal({ project, isOpen, onClose, onLinkClick }: ProjectModalProps) {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const images = project.images?.length ? project.images : project.featured_image ? [project.featured_image] : [];
  
  const formatUrl = (url: string) => url.startsWith("http") ? url : `https://${url}`;

  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-background/80 backdrop-blur-md z-50"
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 md:inset-10 lg:inset-20 z-50 flex items-center justify-center"
          >
            <div className="relative w-full max-w-5xl max-h-full overflow-hidden rounded-3xl bg-card border border-border shadow-2xl">
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 z-10 p-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="grid lg:grid-cols-2 max-h-[85vh] overflow-y-auto">
                {/* Image Gallery */}
                <div className="relative aspect-video lg:aspect-auto lg:h-full bg-gradient-to-br from-primary/20 to-purple-500/20">
                  {images.length > 0 ? (
                    <>
                      <motion.img
                        key={currentImageIndex}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        src={images[currentImageIndex]}
                        alt={`${project.title} - Image ${currentImageIndex + 1}`}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Image navigation */}
                      {images.length > 1 && (
                        <>
                          <button
                            onClick={prevImage}
                            className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors"
                          >
                            <ChevronLeft className="w-5 h-5" />
                          </button>
                          <button
                            onClick={nextImage}
                            className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-background/50 backdrop-blur-sm hover:bg-background/80 transition-colors"
                          >
                            <ChevronRight className="w-5 h-5" />
                          </button>
                          
                          {/* Dots indicator */}
                          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                            {images.map((_, index) => (
                              <button
                                key={index}
                                onClick={() => setCurrentImageIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${
                                  index === currentImageIndex
                                    ? "bg-primary w-6"
                                    : "bg-foreground/30 hover:bg-foreground/50"
                                }`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-8xl font-bold gradient-text opacity-30">
                        {project.title.charAt(0)}
                      </div>
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="p-8 lg:p-10 space-y-6">
                  <div>
                    <motion.h3
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                      className="text-3xl font-bold mb-4"
                    >
                      {project.title}
                    </motion.h3>
                    <motion.p
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                      className="text-muted-foreground leading-relaxed"
                    >
                      {project.description}
                    </motion.p>
                  </div>

                  {/* Technologies */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                      Technologies Used
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, i) => (
                        <span
                          key={i}
                          className="px-3 py-1.5 rounded-lg bg-secondary/50 border border-border/50 text-sm font-medium"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </motion.div>

                  {/* Links */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-wrap gap-3 pt-4"
                  >
                    {project.link && (
                      <Button asChild className="gap-2">
                        <a
                          href={formatUrl(project.link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onLinkClick?.("project", project.link)}
                        >
                          View Live <ExternalLink className="w-4 h-4" />
                        </a>
                      </Button>
                    )}
                    {project.github_link && (
                      <Button variant="outline" asChild className="gap-2">
                        <a
                          href={formatUrl(project.github_link)}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => onLinkClick?.("github", project.github_link!)}
                        >
                          <Github className="w-4 h-4" /> Source Code
                        </a>
                      </Button>
                    )}
                  </motion.div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export function PortfolioProjects({ title = "Featured Projects", projects, onLinkClick }: PortfolioProjectsProps) {
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const featuredProject = projects[0];
  const otherProjects = projects.slice(1);

  const formatUrl = (url: string) => url.startsWith("http") ? url : `https://${url}`;

  return (
    <section id="projects" className="py-32 px-6 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {/* Header */}
        <AnimatedSection className="text-center mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
          >
            <span>🚀</span>
            <span>My Work</span>
          </motion.div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            A selection of my recent work and personal projects
          </p>
        </AnimatedSection>

        {/* Featured Project */}
        {featuredProject && (
          <AnimatedSection className="mb-16">
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ duration: 0.3 }}
              onClick={() => setSelectedProject(featuredProject)}
              className="group cursor-pointer grid lg:grid-cols-2 gap-8 items-center p-8 rounded-3xl bg-card/30 border border-border/30 hover:border-primary/30 transition-all duration-500 backdrop-blur-sm"
            >
              {/* Project Image */}
              <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-primary/20 to-purple-500/20">
                {featuredProject.featured_image || (featuredProject.images && featuredProject.images[0]) ? (
                  <motion.img
                    src={featuredProject.featured_image || featuredProject.images![0]}
                    alt={featuredProject.title}
                    className="w-full h-full object-cover"
                    whileHover={{ scale: 1.05 }}
                    transition={{ duration: 0.5 }}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-7xl font-bold gradient-text opacity-50">
                      {featuredProject.title.charAt(0)}
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                {/* Hover overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <motion.div
                    initial={{ scale: 0.8 }}
                    whileHover={{ scale: 1 }}
                    className="px-6 py-3 rounded-full bg-primary text-primary-foreground font-medium flex items-center gap-2"
                  >
                    View Details <ArrowUpRight className="w-4 h-4" />
                  </motion.div>
                </div>
              </div>

              {/* Project Info */}
              <div className="space-y-6">
                <div className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium">
                  Featured Project
                </div>
                <h3 className="text-3xl font-bold group-hover:text-primary transition-colors">
                  {featuredProject.title}
                </h3>
                <p className="text-muted-foreground leading-relaxed line-clamp-3">
                  {featuredProject.description}
                </p>

                <div className="flex flex-wrap gap-2">
                  {featuredProject.technologies.slice(0, 5).map((tech, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 rounded-lg bg-secondary/50 text-sm font-medium"
                    >
                      {tech}
                    </span>
                  ))}
                  {featuredProject.technologies.length > 5 && (
                    <span className="px-3 py-1 rounded-lg bg-secondary/50 text-sm font-medium">
                      +{featuredProject.technologies.length - 5}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
        )}

        {/* Other Projects Grid */}
        {otherProjects.length > 0 && (
          <StaggerContainer className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {otherProjects.map((project, index) => (
              <StaggerItem key={index}>
                <motion.div
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  onClick={() => setSelectedProject(project)}
                  className="group cursor-pointer h-full p-6 rounded-2xl bg-card/30 border border-border/30 hover:border-primary/30 transition-all duration-300 backdrop-blur-sm"
                >
                  {/* Project Image */}
                  <div className="relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br from-primary/10 to-purple-500/10 mb-5">
                    {project.featured_image || (project.images && project.images[0]) ? (
                      <motion.img
                        src={project.featured_image || project.images![0]}
                        alt={project.title}
                        className="w-full h-full object-cover"
                        whileHover={{ scale: 1.05 }}
                        transition={{ duration: 0.3 }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-4xl font-bold gradient-text opacity-30">
                          {project.title.charAt(0)}
                        </div>
                      </div>
                    )}
                    
                    {/* Hover overlay */}
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="p-3 rounded-full bg-background/90">
                        <ArrowUpRight className="w-5 h-5" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors">
                    {project.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                    {project.description}
                  </p>

                  <div className="flex flex-wrap gap-1">
                    {project.technologies.slice(0, 3).map((tech, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-secondary/50 text-xs font-medium">
                        {tech}
                      </span>
                    ))}
                    {project.technologies.length > 3 && (
                      <span className="px-2 py-0.5 rounded bg-secondary/50 text-xs font-medium">
                        +{project.technologies.length - 3}
                      </span>
                    )}
                  </div>
                </motion.div>
              </StaggerItem>
            ))}
          </StaggerContainer>
        )}
      </div>

      {/* Project Modal */}
      <ProjectModal
        project={selectedProject!}
        isOpen={!!selectedProject}
        onClose={() => setSelectedProject(null)}
        onLinkClick={onLinkClick}
      />
    </section>
  );
}
