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
} from "@/components/portfolio";
import type { 
  Project, 
  Experience, 
  Testimonial, 
  ContactSettings, 
  SEOSettings,
  SectionVisibility,
  SectionTitles
} from "@/types/portfolio";

interface PortfolioData {
  id: string;
  username: string;
  role: string;
  hero_title: string | null;
  hero_subtitle: string | null;
  about_text: string | null;
  skills: string[];
  projects: Project[];
  experience: Experience[];
  education: any[];
  links: { github?: string; linkedin?: string; website?: string; twitter?: string };
  profile_picture_url: string | null;
  testimonials: Testimonial[];
  contact_settings: ContactSettings;
  seo_settings: SEOSettings;
  section_titles: SectionTitles;
}

interface PortfolioLinkData {
  id: string;
  portfolio_id: string;
  name: string;
  section_visibility: SectionVisibility;
  is_active: boolean;
  view_count: number;
}

const defaultSectionVisibility: SectionVisibility = {
  hero: true, about: true, skills: true, projects: true,
  experience: true, education: true, testimonials: true, contact: true,
};

const defaultSectionTitles: SectionTitles = {
  hero: "Hero", about: "About Me", skills: "Skills & Expertise",
  projects: "Featured Projects", experience: "Experience",
  education: "Education", testimonials: "Testimonials", contact: "Get In Touch",
};

const defaultContactSettings: ContactSettings = {
  email: null, whatsapp: null, show_form: true, sticky_button: false,
};

export default function PublicLinkPortfolio() {
  const { slug } = useParams<{ slug: string }>();
  const [portfolio, setPortfolio] = useState<PortfolioData | null>(null);
  const [linkData, setLinkData] = useState<PortfolioLinkData | null>(null);
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
      const { data: link, error: linkError } = await supabase
        .from("portfolio_links")
        .select("*")
        .eq("slug", slug)
        .eq("is_active", true)
        .single();

      if (linkError || !link) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLinkData({
        ...link,
        section_visibility: (link.section_visibility as unknown as SectionVisibility) || defaultSectionVisibility,
      });

      const { data, error } = await supabase
        .from("portfolios")
        .select("id, username, role, hero_title, hero_subtitle, about_text, skills, projects, experience, education, links, profile_picture_url, testimonials, contact_settings, seo_settings, section_titles")
        .eq("id", link.portfolio_id)
        .single();

      if (error || !data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        await supabase.from("portfolio_links").update({ view_count: (link.view_count || 0) + 1 }).eq("id", link.id);
      } catch (e) {}

      setPortfolio({
        ...data,
        skills: Array.isArray(data.skills) ? data.skills as string[] : [],
        projects: Array.isArray(data.projects) ? data.projects as unknown as Project[] : [],
        experience: Array.isArray(data.experience) ? data.experience as unknown as Experience[] : [],
        education: Array.isArray(data.education) ? data.education : [],
        links: data.links as PortfolioData["links"] || {},
        testimonials: Array.isArray(data.testimonials) ? data.testimonials as unknown as Testimonial[] : [],
        contact_settings: (data.contact_settings as unknown as ContactSettings) || defaultContactSettings,
        seo_settings: (data.seo_settings as unknown as SEOSettings) || { meta_title: null, meta_description: null, favicon_url: null, og_image_url: null },
        section_titles: (data.section_titles as unknown as SectionTitles) || defaultSectionTitles,
      });
      setLoading(false);
    };

    if (slug) fetchPortfolio();
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-12 h-12 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !portfolio || !linkData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-4">Link Not Found</h1>
          <a href="/" className="text-primary hover:underline inline-flex items-center gap-2">
            <ArrowLeft className="w-4 h-4" /> Back to Portfolify
          </a>
        </div>
      </div>
    );
  }

  const visibility = linkData.section_visibility;
  const titles = portfolio.section_titles;
  const name = portfolio.hero_title?.split(" - ")[0] || portfolio.username;
  const displayTitle = portfolio.hero_title?.split(" - ")[1] || portfolio.role.replace(/_/g, ' ');
  const stats = { projects: portfolio.projects.length, experience: portfolio.experience.length, clients: portfolio.testimonials.length };

  return (
    <>
      <Helmet>
        <title>{portfolio.hero_title || linkData.name} | Portfolify</title>
        <meta name="description" content={portfolio.hero_subtitle || ""} />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        {visibility.hero && <PortfolioHero name={name} title={displayTitle} subtitle={portfolio.hero_subtitle || ""} profilePicture={portfolio.profile_picture_url} links={portfolio.links} stats={stats} onLinkClick={trackLinkClick} contactEmail={portfolio.contact_settings?.email} />}
        {visibility.about && portfolio.about_text && <PortfolioAbout title={titles.about} aboutText={portfolio.about_text} role={portfolio.role} />}
        {visibility.skills && portfolio.skills.length > 0 && <PortfolioSkills title={titles.skills} skills={portfolio.skills} />}
        {visibility.projects && portfolio.projects.length > 0 && <PortfolioProjects title={titles.projects} projects={portfolio.projects} onLinkClick={trackLinkClick} />}
        {visibility.experience && portfolio.experience.length > 0 && <PortfolioExperience title={titles.experience} experience={portfolio.experience} education={portfolio.education} showEducation={visibility.education} />}
        {visibility.testimonials && portfolio.testimonials.length > 0 && <PortfolioTestimonials title={titles.testimonials} testimonials={portfolio.testimonials} />}
        {visibility.contact && <PortfolioContact title={titles.contact} email={portfolio.contact_settings?.email} whatsapp={portfolio.contact_settings?.whatsapp} showForm={portfolio.contact_settings?.show_form} links={portfolio.links} />}
        <PortfolioFooter name={name} />
      </div>
    </>
  );
}
