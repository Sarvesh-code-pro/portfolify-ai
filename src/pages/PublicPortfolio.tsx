import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft } from "lucide-react";
import { Helmet } from "react-helmet-async";
import {
  PortfolioHero,
  PortfolioAbout,
  PortfolioSkills,
  PortfolioProjects,
  PortfolioExperience,
  PortfolioTestimonials,
  PortfolioContact,
  PortfolioFooter,
  PortfolioCertificates,
} from "@/components/portfolio";
import type { 
  Portfolio, 
  Project, 
  Experience, 
  Testimonial,
  Certificate,
  ContactSettings, 
  SEOSettings,
  SectionVisibility,
  SectionTitles
} from "@/types/portfolio";

interface PortfolioData {
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
  education: any[];
  links: { github?: string; linkedin?: string; website?: string; twitter?: string };
  template: string;
  theme: { primaryColor: string; backgroundColor: string; textColor: string };
  profile_picture_url: string | null;
  testimonials: Testimonial[];
  contact_settings: ContactSettings;
  seo_settings: SEOSettings;
  section_visibility: SectionVisibility;
  section_titles: SectionTitles;
}

const defaultSectionVisibility: SectionVisibility = {
  hero: true,
  about: true,
  skills: true,
  projects: true,
  experience: true,
  education: true,
  testimonials: true,
  contact: true,
};

const defaultSectionTitles: SectionTitles = {
  hero: "Hero",
  about: "About Me",
  skills: "Skills & Expertise",
  projects: "Featured Projects",
  experience: "Experience",
  education: "Education",
  testimonials: "Testimonials",
  contact: "Get In Touch",
};

const defaultContactSettings: ContactSettings = {
  email: null,
  whatsapp: null,
  show_form: true,
  sticky_button: false,
};

export default function PublicPortfolio() {
  const { username } = useParams<{ username: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
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
        .select("id, username, role, status, hero_title, hero_subtitle, about_text, skills, projects, experience, education, links, theme, template, profile_picture_url, testimonials, contact_settings, seo_settings, section_visibility, section_titles")
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
        education: Array.isArray(data.education) ? data.education : [],
        links: data.links as PortfolioData["links"] || {},
        theme: data.theme as PortfolioData["theme"] || { primaryColor: "#3B82F6", backgroundColor: "#0F172A", textColor: "#F8FAFC" },
        testimonials: Array.isArray(data.testimonials) ? data.testimonials as unknown as Testimonial[] : [],
        contact_settings: (data.contact_settings as unknown as ContactSettings) || defaultContactSettings,
        seo_settings: (data.seo_settings as unknown as SEOSettings) || { meta_title: null, meta_description: null, favicon_url: null, og_image_url: null },
        section_visibility: data.section_visibility as SectionVisibility || defaultSectionVisibility,
        section_titles: data.section_titles as SectionTitles || defaultSectionTitles,
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
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading portfolio...</p>
        </div>
      </div>
    );
  }

  if (notFound || !portfolio) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
            <span className="text-4xl">🔍</span>
          </div>
          <h1 className="text-3xl font-bold mb-4">Portfolio Not Found</h1>
          <p className="text-muted-foreground mb-8">
            This portfolio doesn't exist or hasn't been published yet.
          </p>
          <a 
            href="/" 
            className="inline-flex items-center gap-2 text-primary hover:underline"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolify
          </a>
        </div>
      </div>
    );
  }

  const visibility = portfolio.section_visibility;
  const titles = portfolio.section_titles;
  const name = portfolio.hero_title?.split(" - ")[0] || portfolio.username;
  const titleParts = portfolio.hero_title?.split(" - ") || [];
  const displayTitle = titleParts[1] || portfolio.role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  // Calculate stats
  const stats = {
    projects: portfolio.projects.length,
    experience: portfolio.experience.length,
    clients: portfolio.testimonials.length,
  };

  return (
    <>
      <Helmet>
        <title>{portfolio.seo_settings?.meta_title || portfolio.hero_title || "Portfolio"} | Portfolify</title>
        <meta 
          name="description" 
          content={portfolio.seo_settings?.meta_description || portfolio.hero_subtitle || portfolio.about_text?.slice(0, 160) || "Professional portfolio"} 
        />
        <meta property="og:title" content={portfolio.seo_settings?.meta_title || portfolio.hero_title || "Portfolio"} />
        <meta property="og:description" content={portfolio.seo_settings?.meta_description || portfolio.hero_subtitle || ""} />
        {portfolio.seo_settings?.og_image_url && (
          <meta property="og:image" content={portfolio.seo_settings.og_image_url} />
        )}
        {portfolio.seo_settings?.favicon_url && (
          <link rel="icon" href={portfolio.seo_settings.favicon_url} />
        )}
        <meta name="robots" content="index, follow" />
      </Helmet>

      <div className="min-h-screen bg-background text-foreground">
        {/* Hero Section */}
        {visibility.hero && (
          <PortfolioHero
            name={name}
            title={displayTitle}
            subtitle={portfolio.hero_subtitle || "Passionate about creating amazing digital experiences"}
            profilePicture={portfolio.profile_picture_url}
            links={portfolio.links}
            stats={stats}
            onLinkClick={trackLinkClick}
            contactEmail={portfolio.contact_settings?.email}
          />
        )}

        {/* About Section */}
        {visibility.about && portfolio.about_text && (
          <PortfolioAbout
            title={titles.about || "About Me"}
            aboutText={portfolio.about_text}
            role={portfolio.role}
          />
        )}

        {/* Skills Section */}
        {visibility.skills && portfolio.skills.length > 0 && (
          <PortfolioSkills
            title={titles.skills || "Skills & Expertise"}
            skills={portfolio.skills}
          />
        )}

        {/* Projects Section */}
        {visibility.projects && portfolio.projects.length > 0 && (
          <PortfolioProjects
            title={titles.projects || "Featured Projects"}
            projects={portfolio.projects}
            onLinkClick={trackLinkClick}
          />
        )}

        {/* Experience Section */}
        {visibility.experience && portfolio.experience.length > 0 && (
          <PortfolioExperience
            title={titles.experience || "Experience"}
            experience={portfolio.experience}
            education={portfolio.education}
            showEducation={visibility.education}
          />
        )}

        {/* Testimonials Section */}
        {visibility.testimonials && portfolio.testimonials.length > 0 && (
          <PortfolioTestimonials
            title={titles.testimonials || "Testimonials"}
            testimonials={portfolio.testimonials}
          />
        )}

        {/* Contact Section */}
        {visibility.contact && (
          <PortfolioContact
            title={titles.contact || "Get In Touch"}
            email={portfolio.contact_settings?.email}
            whatsapp={portfolio.contact_settings?.whatsapp}
            showForm={portfolio.contact_settings?.show_form}
            links={portfolio.links}
          />
        )}

        {/* Footer */}
        <PortfolioFooter name={name} />
      </div>
    </>
  );
}
