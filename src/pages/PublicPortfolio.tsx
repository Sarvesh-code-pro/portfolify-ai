import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Github, Linkedin, Globe, ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";

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

interface Portfolio {
  id: string;
  username: string;
  role: string;
  status: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  skills: string[];
  projects: Project[];
  experience: Experience[];
  links: { github?: string; linkedin?: string; website?: string };
  template: string;
  theme: { primaryColor: string; backgroundColor: string; textColor: string };
}

export default function PublicPortfolio() {
  const { username } = useParams<{ username: string }>();
  const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const trackLinkClick = async (linkType: string, linkUrl: string) => {
    if (!portfolio) return;
    try {
      await supabase.functions.invoke("track-analytics", {
        body: { portfolioId: portfolio.id, action: "link_click", linkType, linkUrl }
      });
    } catch (e) {
      console.error("Failed to track click:", e);
    }
  };

  useEffect(() => {
    const fetchPortfolio = async () => {
      const { data, error } = await supabase
        .from("portfolios")
        .select("*")
        .eq("username", username)
        .eq("status", "published")
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      // Track view
      try {
        await supabase.functions.invoke("track-analytics", {
          body: { portfolioId: data.id, action: "view" }
        });
      } catch (e) {
        console.error("Failed to track view:", e);
      }

      setPortfolio({
        ...data,
        skills: Array.isArray(data.skills) ? data.skills as string[] : [],
        projects: Array.isArray(data.projects) ? data.projects as unknown as Project[] : [],
        experience: Array.isArray(data.experience) ? data.experience as unknown as Experience[] : [],
        links: data.links as Portfolio["links"] || {},
        theme: data.theme as Portfolio["theme"] || { primaryColor: "#3B82F6", backgroundColor: "#0F172A", textColor: "#F8FAFC" }
      });
      setLoading(false);
    };

    if (username) {
      fetchPortfolio();
    }
  }, [username]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Portfolio not found</h1>
          <p className="text-muted-foreground mb-6">This portfolio doesn't exist or isn't published yet.</p>
          <a href="/" className="text-primary hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolify
          </a>
        </div>
      </div>
    );
  }

  const { theme, template } = portfolio;
  const name = portfolio.hero_title?.split(" - ")[0] || "Portfolio";

  return (
    <>
      <Helmet>
        <title>{portfolio.hero_title || "Portfolio"} | Portfolify</title>
        <meta name="description" content={portfolio.hero_subtitle || portfolio.about_text?.slice(0, 160) || "Professional portfolio"} />
        <meta property="og:title" content={portfolio.hero_title || "Portfolio"} />
        <meta property="og:description" content={portfolio.hero_subtitle || ""} />
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div 
        className="min-h-screen"
        style={{ 
          backgroundColor: theme.backgroundColor,
          color: theme.textColor
        }}
      >
        <div className="max-w-4xl mx-auto px-6 py-16">
          {/* Hero */}
          <section className="text-center mb-20">
            <h1 
              className="text-5xl md:text-6xl font-bold mb-4"
              style={{ fontFamily: template === "elegant" ? "serif" : "inherit" }}
            >
              {portfolio.hero_title || "Your Name"}
            </h1>
            <p className="text-xl md:text-2xl opacity-70 max-w-2xl mx-auto">
              {portfolio.hero_subtitle || "Your tagline goes here"}
            </p>
            
            {/* Links */}
            <div className="flex items-center justify-center gap-4 mt-8">
              {portfolio.links.github && (
                <a 
                  href={portfolio.links.github.startsWith("http") ? portfolio.links.github : `https://${portfolio.links.github}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => trackLinkClick("github", portfolio.links.github!)}
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
                  onClick={() => trackLinkClick("linkedin", portfolio.links.linkedin!)}
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
                  onClick={() => trackLinkClick("website", portfolio.links.website!)}
                  className="p-3 rounded-full transition-colors hover:opacity-70"
                  style={{ backgroundColor: `${theme.primaryColor}20` }}
                >
                  <Globe className="w-5 h-5" style={{ color: theme.primaryColor }} />
                </a>
              )}
            </div>
          </section>

          {/* About */}
          {portfolio.about_text && (
            <section className="mb-16">
              <h2 
                className="text-2xl font-bold mb-6"
                style={{ color: theme.primaryColor }}
              >
                About
              </h2>
              <p className="text-lg leading-relaxed opacity-80 whitespace-pre-line">
                {portfolio.about_text}
              </p>
            </section>
          )}

          {/* Skills */}
          {portfolio.skills.length > 0 && (
            <section className="mb-16">
              <h2 
                className="text-2xl font-bold mb-6"
                style={{ color: theme.primaryColor }}
              >
                Skills
              </h2>
              <div className="flex flex-wrap gap-3">
                {portfolio.skills.map((skill, index) => (
                  <span
                    key={index}
                    className="px-4 py-2 rounded-full text-sm font-medium"
                    style={{ 
                      backgroundColor: `${theme.primaryColor}20`,
                      color: theme.primaryColor
                    }}
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          )}

          {/* Projects */}
          {portfolio.projects.length > 0 && (
            <section className="mb-16">
              <h2 
                className="text-2xl font-bold mb-6"
                style={{ color: theme.primaryColor }}
              >
                Projects
              </h2>
              <div className="grid gap-6">
                {portfolio.projects.map((project, index) => (
                  <div
                    key={index}
                    className="p-6 rounded-2xl border"
                    style={{ 
                      borderColor: `${theme.primaryColor}30`,
                      backgroundColor: `${theme.primaryColor}05`
                    }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="text-xl font-semibold">{project.title}</h3>
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
                    {project.technologies.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {project.technologies.map((tech, i) => (
                          <span
                            key={i}
                            className="px-2 py-1 rounded text-xs opacity-60"
                            style={{ backgroundColor: `${theme.textColor}10` }}
                          >
                            {tech}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Experience */}
          {portfolio.experience.length > 0 && (
            <section className="mb-16">
              <h2 
                className="text-2xl font-bold mb-6"
                style={{ color: theme.primaryColor }}
              >
                Experience
              </h2>
              <div className="space-y-6">
                {portfolio.experience.map((exp, index) => (
                  <div key={index} className="border-l-2 pl-6" style={{ borderColor: theme.primaryColor }}>
                    <h3 className="text-lg font-semibold">{exp.role}</h3>
                    <p className="opacity-60 mb-2">{exp.company} • {exp.period}</p>
                    <p className="opacity-80">{exp.description}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Footer */}
          <footer className="text-center pt-12 border-t opacity-50" style={{ borderColor: `${theme.textColor}20` }}>
            <p className="text-sm">
              Built with{" "}
              <a href="/" className="hover:underline" style={{ color: theme.primaryColor }}>
                Portfolify
              </a>
            </p>
          </footer>
        </div>
      </div>
    </>
  );
}
