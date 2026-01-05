import { Github, Linkedin, Globe, Mail, MessageCircle, ExternalLink, Quote, ArrowRight } from "lucide-react";
import type { Portfolio, Testimonial, CustomSection, SectionVisibility, SectionTitles } from "@/types/portfolio";
import { useEffect, useRef } from "react";
import { motion } from "framer-motion";

interface EnhancedPortfolioPreviewProps {
  portfolio: Portfolio;
  sectionOrder?: string[];
  sectionVisibility?: SectionVisibility;
  sectionTitles?: SectionTitles;
}

// Template-specific style configurations
const templateStyles = {
  minimal: {
    container: "max-w-3xl",
    heroClass: "text-center py-24",
    sectionClass: "mb-20",
    cardClass: "",
    headingClass: "text-xl font-light tracking-wide",
    spacing: "gap-20",
  },
  bold: {
    container: "max-w-5xl",
    heroClass: "text-left py-32",
    sectionClass: "mb-16",
    cardClass: "bg-primary/5 p-6 rounded-2xl",
    headingClass: "text-3xl font-black uppercase tracking-tight",
    spacing: "gap-12",
  },
  elegant: {
    container: "max-w-4xl",
    heroClass: "text-center py-28",
    sectionClass: "mb-18",
    cardClass: "border border-current/10 p-6 rounded-xl",
    headingClass: "text-2xl font-serif italic",
    spacing: "gap-16",
  },
  creative: {
    container: "max-w-5xl",
    heroClass: "text-left py-20",
    sectionClass: "mb-16",
    cardClass: "bg-gradient-to-br from-primary/5 to-transparent p-6 rounded-3xl",
    headingClass: "text-2xl font-bold",
    spacing: "gap-14",
  },
  modern: {
    container: "max-w-4xl",
    heroClass: "text-center py-24",
    sectionClass: "mb-16",
    cardClass: "bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl",
    headingClass: "text-2xl font-semibold",
    spacing: "gap-16",
  },
  professional: {
    container: "max-w-4xl",
    heroClass: "text-left py-20 border-b",
    sectionClass: "mb-14",
    cardClass: "border-l-4 border-primary pl-6",
    headingClass: "text-lg font-bold uppercase tracking-widest",
    spacing: "gap-12",
  },
};

export function EnhancedPortfolioPreview({ 
  portfolio,
  sectionOrder = ["hero", "about", "skills", "projects", "experience", "education", "testimonials", "contact"],
  sectionVisibility,
  sectionTitles,
}: EnhancedPortfolioPreviewProps) {
  const { theme, template } = portfolio;
  const visibility = sectionVisibility || portfolio.section_visibility;
  const titles = sectionTitles || portfolio.section_titles;
  const styles = templateStyles[template as keyof typeof templateStyles] || templateStyles.modern;

  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("animate-fade-in");
          }
        });
      },
      { threshold: 0.1 }
    );

    Object.values(sectionRefs.current).forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const renderHero = () => {
    const isMinimal = template === "minimal";
    const isBold = template === "bold";
    const isElegant = template === "elegant";
    const isCreative = template === "creative";
    const isProfessional = template === "professional";

    return (
      <section 
        key="hero" 
        ref={(el) => (sectionRefs.current.hero = el)}
        className={`opacity-0 animate-fade-in ${styles.heroClass}`}
        style={{ borderColor: `${theme.textColor}20` }}
      >
        {/* Profile picture - varies by template */}
        {portfolio.profile_picture_url && (
          <div className={`mb-8 ${isBold || isProfessional ? '' : 'flex justify-center'}`}>
            <div 
              className={`overflow-hidden ${
                isMinimal ? 'w-24 h-24 rounded-full' :
                isBold ? 'w-40 h-40 rounded-3xl' :
                isElegant ? 'w-32 h-32 rounded-full border-2' :
                isCreative ? 'w-36 h-36 rounded-2xl rotate-3' :
                'w-32 h-32 rounded-2xl'
              }`}
              style={{ borderColor: theme.primaryColor }}
            >
              <img src={portfolio.profile_picture_url} alt="Profile" className="w-full h-full object-cover" />
            </div>
          </div>
        )}
        
        <h1 
          className={`mb-4 ${
            isMinimal ? 'text-4xl font-light' :
            isBold ? 'text-6xl md:text-7xl font-black' :
            isElegant ? 'text-5xl font-serif' :
            isCreative ? 'text-5xl md:text-6xl font-bold' :
            isProfessional ? 'text-4xl font-bold' :
            'text-5xl md:text-6xl font-bold'
          }`}
        >
          {portfolio.hero_title || "Your Name"}
        </h1>
        
        <p className={`max-w-2xl opacity-70 ${
          isMinimal ? 'text-lg' :
          isBold ? 'text-2xl font-medium' :
          isElegant ? 'text-xl italic' :
          isCreative ? 'text-xl' :
          'text-xl md:text-2xl'
        } ${(isMinimal || isElegant || template === 'modern') ? 'mx-auto' : ''}`}>
          {portfolio.hero_subtitle || "Your tagline goes here"}
        </p>
        
        {/* Social Links */}
        <div className={`flex items-center gap-4 mt-8 ${
          (isMinimal || isElegant || template === 'modern') ? 'justify-center' : ''
        }`}>
          {portfolio.links.github && (
            <a href={portfolio.links.github.startsWith("http") ? portfolio.links.github : `https://${portfolio.links.github}`}
              target="_blank" rel="noopener noreferrer"
              className={`p-3 transition-all hover:scale-110 ${
                isMinimal ? 'rounded-full' :
                isBold ? 'rounded-xl' :
                'rounded-full'
              }`}
              style={{ backgroundColor: `${theme.primaryColor}20` }}>
              <Github className="w-5 h-5" style={{ color: theme.primaryColor }} />
            </a>
          )}
          {portfolio.links.linkedin && (
            <a href={portfolio.links.linkedin.startsWith("http") ? portfolio.links.linkedin : `https://${portfolio.links.linkedin}`}
              target="_blank" rel="noopener noreferrer"
              className={`p-3 transition-all hover:scale-110 ${
                isMinimal ? 'rounded-full' :
                isBold ? 'rounded-xl' :
                'rounded-full'
              }`}
              style={{ backgroundColor: `${theme.primaryColor}20` }}>
              <Linkedin className="w-5 h-5" style={{ color: theme.primaryColor }} />
            </a>
          )}
          {portfolio.links.website && (
            <a href={portfolio.links.website.startsWith("http") ? portfolio.links.website : `https://${portfolio.links.website}`}
              target="_blank" rel="noopener noreferrer"
              className={`p-3 transition-all hover:scale-110 ${
                isMinimal ? 'rounded-full' :
                isBold ? 'rounded-xl' :
                'rounded-full'
              }`}
              style={{ backgroundColor: `${theme.primaryColor}20` }}>
              <Globe className="w-5 h-5" style={{ color: theme.primaryColor }} />
            </a>
          )}
        </div>
      </section>
    );
  };

  const renderSection = (sectionId: string) => {
    if (!visibility[sectionId]) return null;

    switch (sectionId) {
      case "hero":
        return renderHero();

      case "about":
        if (!portfolio.about_text) return null;
        return (
          <section key="about" ref={(el) => (sectionRefs.current.about = el)} className={`${styles.sectionClass} opacity-0`}>
            <h2 className={styles.headingClass} style={{ color: theme.primaryColor }}>
              {titles?.about || "About"}
            </h2>
            <p className="text-lg leading-relaxed opacity-80 whitespace-pre-line mt-4">{portfolio.about_text}</p>
          </section>
        );

      case "skills":
        if (!portfolio.skills.length) return null;
        return (
          <section key="skills" ref={(el) => (sectionRefs.current.skills = el)} className={`${styles.sectionClass} opacity-0`}>
            <h2 className={styles.headingClass} style={{ color: theme.primaryColor }}>
              {titles?.skills || "Skills"}
            </h2>
            <div className={`flex flex-wrap mt-4 ${template === 'minimal' ? 'gap-2' : 'gap-3'}`}>
              {portfolio.skills.map((skill, i) => (
                <span 
                  key={i} 
                  className={`font-medium transition-transform hover:scale-105 ${
                    template === 'minimal' ? 'px-3 py-1 text-sm' :
                    template === 'bold' ? 'px-5 py-2 rounded-xl text-sm uppercase tracking-wide' :
                    template === 'elegant' ? 'px-4 py-2 rounded-full text-sm border' :
                    template === 'professional' ? 'px-3 py-1 text-sm bg-transparent border-b-2' :
                    'px-4 py-2 rounded-full text-sm'
                  }`}
                  style={{ 
                    backgroundColor: template === 'professional' ? 'transparent' : `${theme.primaryColor}20`, 
                    color: theme.primaryColor,
                    borderColor: theme.primaryColor
                  }}>
                  {skill}
                </span>
              ))}
            </div>
          </section>
        );

      case "projects":
        if (!portfolio.projects.length) return null;
        return (
          <section key="projects" ref={(el) => (sectionRefs.current.projects = el)} className={`${styles.sectionClass} opacity-0`}>
            <h2 className={styles.headingClass} style={{ color: theme.primaryColor }}>
              {titles?.projects || "Projects"}
            </h2>
            <div className={`mt-6 ${
              template === 'minimal' ? 'space-y-8' :
              template === 'bold' ? 'grid gap-6 md:grid-cols-2' :
              template === 'creative' ? 'grid gap-6 md:grid-cols-2' :
              'grid gap-6 md:grid-cols-2'
            }`}>
              {portfolio.projects.map((project, i) => (
                <div 
                  key={i} 
                  className={`transition-all hover:shadow-xl hover:-translate-y-1 group overflow-hidden ${styles.cardClass} ${
                    template === 'minimal' ? 'py-6 border-b' : 'p-6 rounded-2xl'
                  }`}
                  style={{ 
                    borderColor: `${theme.primaryColor}30`, 
                    backgroundColor: template === 'minimal' ? 'transparent' : `${theme.primaryColor}05` 
                  }}>
                  {project.featured_image && template !== 'minimal' && (
                    <div className="aspect-video rounded-lg overflow-hidden mb-4 -mx-2 -mt-2">
                      <img src={project.featured_image} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                  )}
                  <div className="flex items-start justify-between mb-3">
                    <h3 className={`font-semibold ${template === 'bold' ? 'text-xl' : 'text-lg'}`}>
                      {project.title || "Untitled"}
                    </h3>
                    {project.link && (
                      <a href={project.link.startsWith("http") ? project.link : `https://${project.link}`}
                        target="_blank" rel="noopener noreferrer" 
                        className="flex items-center gap-1 text-sm hover:underline"
                        style={{ color: theme.primaryColor }}>
                        View <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="opacity-70 mb-4 line-clamp-3">{project.description}</p>
                  {project.technologies.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {project.technologies.map((tech, j) => (
                        <span key={j} className="px-2 py-1 rounded text-xs opacity-60" style={{ backgroundColor: `${theme.textColor}10` }}>
                          {tech}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        );

      case "experience":
        if (!portfolio.experience.length) return null;
        return (
          <section key="experience" ref={(el) => (sectionRefs.current.experience = el)} className={`${styles.sectionClass} opacity-0`}>
            <h2 className={styles.headingClass} style={{ color: theme.primaryColor }}>
              {titles?.experience || "Experience"}
            </h2>
            <div className={`space-y-6 mt-6 ${template === 'professional' ? '' : ''}`}>
              {portfolio.experience.map((exp, i) => (
                <div 
                  key={i} 
                  className={`transition-all ${
                    template === 'minimal' ? 'py-4 border-b' :
                    template === 'professional' ? 'border-l-4 pl-6' :
                    template === 'bold' ? 'p-6 rounded-2xl bg-primary/5' :
                    'border-l-2 pl-6 hover:pl-8'
                  }`}
                  style={{ borderColor: theme.primaryColor }}>
                  <h3 className={`font-semibold ${template === 'bold' ? 'text-xl' : 'text-lg'}`}>{exp.role}</h3>
                  <p className="opacity-60 mb-2">{exp.company} • {exp.period}</p>
                  <p className="opacity-80">{exp.description}</p>
                </div>
              ))}
            </div>
          </section>
        );

      case "testimonials":
        if (!portfolio.testimonials?.length) return null;
        return (
          <section key="testimonials" ref={(el) => (sectionRefs.current.testimonials = el)} className={`${styles.sectionClass} opacity-0`}>
            <h2 className={styles.headingClass} style={{ color: theme.primaryColor }}>
              {titles?.testimonials || "Testimonials"}
            </h2>
            <div className={`mt-6 ${template === 'minimal' ? 'space-y-8' : 'grid gap-6 md:grid-cols-2'}`}>
              {portfolio.testimonials.map((t) => (
                <div 
                  key={t.id} 
                  className={`relative ${
                    template === 'minimal' ? 'py-6 border-b' :
                    template === 'elegant' ? 'p-8 rounded-2xl border italic' :
                    'p-6 rounded-2xl border'
                  }`}
                  style={{ borderColor: `${theme.primaryColor}30`, backgroundColor: template === 'minimal' ? 'transparent' : `${theme.primaryColor}05` }}>
                  {template !== 'minimal' && (
                    <Quote className="w-8 h-8 opacity-20 absolute top-4 right-4" style={{ color: theme.primaryColor }} />
                  )}
                  <p className="mb-4 opacity-80">"{t.content}"</p>
                  <div className="flex items-center gap-3">
                    {t.photo_url && (
                      <img src={t.photo_url} alt={t.name} className="w-10 h-10 rounded-full object-cover" />
                    )}
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-sm opacity-60">{t.role}{t.company ? ` at ${t.company}` : ""}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );

      case "contact":
        if (!portfolio.contact_settings?.show_form && !portfolio.contact_settings?.email && !portfolio.contact_settings?.whatsapp) return null;
        return (
          <section key="contact" ref={(el) => (sectionRefs.current.contact = el)} className={`${styles.sectionClass} opacity-0`}>
            <h2 className={styles.headingClass} style={{ color: theme.primaryColor }}>
              {titles?.contact || "Contact"}
            </h2>
            <div className="flex flex-wrap gap-4 mt-6">
              {portfolio.contact_settings?.email && (
                <a href={`mailto:${portfolio.contact_settings.email}`}
                  className={`flex items-center gap-2 transition-all hover:scale-105 ${
                    template === 'bold' ? 'px-6 py-3 rounded-xl font-bold' :
                    'px-4 py-2 rounded-full'
                  }`}
                  style={{ backgroundColor: `${theme.primaryColor}20`, color: theme.primaryColor }}>
                  <Mail className="w-4 h-4" /> Email
                </a>
              )}
              {portfolio.contact_settings?.whatsapp && (
                <a href={`https://wa.me/${portfolio.contact_settings.whatsapp.replace(/\D/g, "")}`}
                  target="_blank" rel="noopener noreferrer"
                  className={`flex items-center gap-2 transition-all hover:scale-105 ${
                    template === 'bold' ? 'px-6 py-3 rounded-xl font-bold' :
                    'px-4 py-2 rounded-full'
                  }`}
                  style={{ backgroundColor: `${theme.primaryColor}20`, color: theme.primaryColor }}>
                  <MessageCircle className="w-4 h-4" /> WhatsApp
                </a>
              )}
            </div>
          </section>
        );

      default:
        const customSection = portfolio.custom_sections?.find((s) => s.id === sectionId);
        if (!customSection) return null;
        return (
          <section key={sectionId} ref={(el) => (sectionRefs.current[sectionId] = el)} className={`${styles.sectionClass} opacity-0`}>
            <h2 className={styles.headingClass} style={{ color: theme.primaryColor }}>
              {customSection.title}
            </h2>
            <p className="opacity-80 whitespace-pre-line mt-4 mb-4">{customSection.content}</p>
            {customSection.media.length > 0 && (
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3 mb-4">
                {customSection.media.map((url, i) => (
                  <img key={i} src={url} alt="" className="rounded-lg object-cover aspect-video" />
                ))}
              </div>
            )}
            {customSection.links.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {customSection.links.map((link, i) => (
                  <a key={i} href={link.url.startsWith("http") ? link.url : `https://${link.url}`}
                    target="_blank" rel="noopener noreferrer" className="text-sm hover:underline"
                    style={{ color: theme.primaryColor }}>
                    {link.label} →
                  </a>
                ))}
              </div>
            )}
          </section>
        );
    }
  };

  return (
    <div className="h-full overflow-y-auto scroll-smooth" style={{ backgroundColor: theme.backgroundColor, color: theme.textColor }}>
      <div className={`${styles.container} mx-auto px-6 py-16`}>
        {sectionOrder.map(renderSection)}
        <footer className={`text-center pt-12 border-t opacity-50 ${template === 'minimal' ? 'text-xs' : 'text-sm'}`} style={{ borderColor: `${theme.textColor}20` }}>
          <p>Built with Portfolify</p>
        </footer>
      </div>
      
      {portfolio.contact_settings?.sticky_button && (
        <a href={portfolio.contact_settings.email ? `mailto:${portfolio.contact_settings.email}` : "#contact"}
          className={`fixed bottom-6 right-6 shadow-lg transition-all hover:scale-105 font-medium ${
            template === 'bold' ? 'px-8 py-4 rounded-2xl text-lg' :
            template === 'minimal' ? 'px-4 py-2 rounded-full text-sm' :
            'px-6 py-3 rounded-full'
          }`}
          style={{ backgroundColor: theme.primaryColor, color: theme.backgroundColor }}>
          Contact Me
        </a>
      )}
    </div>
  );
}
