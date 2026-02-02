import { Github, Linkedin, Globe } from "lucide-react";

interface Project {
  title: string;
  description: string;
  technologies: string[];
  link: string;
}

interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

interface Testimonial {
  name: string;
  role?: string;
  company?: string;
  content?: string;
  text?: string;
}

interface Portfolio {
  hero_title: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  skills: string[];
  projects: Project[];
  experience: Experience[];
  testimonials?: Testimonial[];
  links: { github?: string; linkedin?: string; website?: string };
  template: string;
  theme: { primaryColor: string; backgroundColor: string; textColor: string };

  // Optional, but present in the editor's state.
  section_order?: string[];
  section_visibility?: Record<string, boolean>;
  section_titles?: Record<string, string>;
}

interface PortfolioPreviewProps {
  portfolio: Portfolio;
}

export function PortfolioPreview({ portfolio }: PortfolioPreviewProps) {
  const { theme, template } = portfolio;

  const defaultOrder = [
    "hero",
    "about",
    "skills",
    "projects",
    "experience",
    "testimonials",
    "contact",
  ];

  const order = Array.isArray(portfolio.section_order) && portfolio.section_order.length > 0
    ? portfolio.section_order.filter((k) => defaultOrder.includes(k))
    : defaultOrder;

  const visibility = portfolio.section_visibility || {};
  const titles = portfolio.section_titles || {};
  const isVisible = (key: string) => visibility[key] ?? true;

  return (
    <div
      className="h-full overflow-y-auto"
      style={{
        backgroundColor: theme.backgroundColor,
        color: theme.textColor,
      }}
    >
      <div className="max-w-4xl mx-auto px-6 py-16">
        {order.map((section) => {
          if (!isVisible(section)) return null;

          switch (section) {
            case "hero":
              return (
                <section key="hero" className="text-center mb-20">
                  <h1
                    className="text-5xl font-bold mb-4"
                    style={{ fontFamily: template === "elegant" ? "serif" : "inherit" }}
                  >
                    {portfolio.hero_title || "Your Name"}
                  </h1>
                  <p className="text-xl opacity-70 max-w-2xl mx-auto">
                    {portfolio.hero_subtitle || "Your tagline goes here"}
                  </p>

                  <div className="flex items-center justify-center gap-4 mt-8">
                    {portfolio.links.github && (
                      <a
                        href={portfolio.links.github.startsWith("http") ? portfolio.links.github : `https://${portfolio.links.github}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full transition-colors hover:opacity-70"
                        style={{ backgroundColor: `${theme.primaryColor}20` }}
                      >
                        <Github className="w-5 h-5" style={{ color: theme.primaryColor }} />
                      </a>
                    )}
                    {portfolio.links.linkedin && (
                      <a
                        href={portfolio.links.linkedin.startsWith("http") ? portfolio.links.linkedin : `https://${portfolio.links.linkedin}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full transition-colors hover:opacity-70"
                        style={{ backgroundColor: `${theme.primaryColor}20` }}
                      >
                        <Linkedin className="w-5 h-5" style={{ color: theme.primaryColor }} />
                      </a>
                    )}
                    {portfolio.links.website && (
                      <a
                        href={portfolio.links.website.startsWith("http") ? portfolio.links.website : `https://${portfolio.links.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-3 rounded-full transition-colors hover:opacity-70"
                        style={{ backgroundColor: `${theme.primaryColor}20` }}
                      >
                        <Globe className="w-5 h-5" style={{ color: theme.primaryColor }} />
                      </a>
                    )}
                  </div>
                </section>
              );

            case "about":
              if (!portfolio.about_text) return null;
              return (
                <section key="about" className="mb-16">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: theme.primaryColor }}>
                    {titles.about || "About"}
                  </h2>
                  <p className="text-lg leading-relaxed opacity-80 whitespace-pre-line">{portfolio.about_text}</p>
                </section>
              );

            case "skills":
              if (!portfolio.skills?.length) return null;
              return (
                <section key="skills" className="mb-16">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: theme.primaryColor }}>
                    {titles.skills || "Skills"}
                  </h2>
                  <div className="flex flex-wrap gap-3">
                    {portfolio.skills.map((skill, index) => (
                      <span
                        key={index}
                        className="px-4 py-2 rounded-full text-sm font-medium"
                        style={{ backgroundColor: `${theme.primaryColor}20`, color: theme.primaryColor }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </section>
              );

            case "projects":
              if (!portfolio.projects?.length) return null;
              return (
                <section key="projects" className="mb-16">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: theme.primaryColor }}>
                    {titles.projects || "Projects"}
                  </h2>
                  <div className="grid gap-6">
                    {portfolio.projects.map((project, index) => (
                      <div
                        key={index}
                        className="p-6 rounded-2xl border"
                        style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}05` }}
                      >
                        <div className="flex items-start justify-between mb-3">
                          <h3 className="text-xl font-semibold">{project.title || "Untitled Project"}</h3>
                          {project.link && (
                            <a
                              href={project.link.startsWith("http") ? project.link : `https://${project.link}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm hover:underline"
                              style={{ color: theme.primaryColor }}
                            >
                              View →
                            </a>
                          )}
                        </div>
                        <p className="opacity-70 mb-4">{project.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case "experience":
              if (!portfolio.experience?.length) return null;
              return (
                <section key="experience" className="mb-16">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: theme.primaryColor }}>
                    {titles.experience || "Experience"}
                  </h2>
                  <div className="space-y-6">
                    {portfolio.experience.map((exp, index) => (
                      <div key={index} className="border-l-2 pl-6" style={{ borderColor: theme.primaryColor }}>
                        <h3 className="text-lg font-semibold">{exp.role}</h3>
                        <p className="opacity-60 mb-2">
                          {exp.company} • {exp.period}
                        </p>
                        <p className="opacity-80">{exp.description}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case "testimonials":
              if (!portfolio.testimonials?.length) return null;
              return (
                <section key="testimonials" className="mb-16">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: theme.primaryColor }}>
                    {titles.testimonials || "Testimonials"}
                  </h2>
                  <div className="grid gap-4">
                    {portfolio.testimonials.slice(0, 3).map((t, i) => (
                      <div
                        key={i}
                        className="p-6 rounded-2xl border"
                        style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: `${theme.primaryColor}05` }}
                      >
                        <p className="opacity-80">“{t.content || t.text || ""}”</p>
                        <div className="mt-4 text-sm opacity-70">
                          <span className="font-medium">{t.name}</span>
                          {(t.role || t.company) && (
                            <span>
                              {" "}— {t.role}
                              {t.role && t.company ? ` @ ${t.company}` : t.company ? ` @ ${t.company}` : ""}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              );

            case "contact":
              return (
                <section key="contact" className="mb-16">
                  <h2 className="text-2xl font-bold mb-6" style={{ color: theme.primaryColor }}>
                    {titles.contact || "Contact"}
                  </h2>
                  <p className="opacity-70">Reach out via the links above.</p>
                </section>
              );

            default:
              return null;
          }
        })}

        <footer className="text-center pt-12 border-t opacity-50" style={{ borderColor: `${theme.textColor}20` }}>
          <p className="text-sm">Built with Portfolify</p>
        </footer>
      </div>
    </div>
  );
}
