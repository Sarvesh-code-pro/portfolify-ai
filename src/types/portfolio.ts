export interface Project {
  id: string;
  title: string;
  description: string;
  technologies: string[];
  link: string;
  images: string[];
  featured_image?: string;
}

export interface Experience {
  company: string;
  role: string;
  period: string;
  description: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  company?: string;
  content: string;
  photo_url?: string;
}

export interface Certificate {
  id: string;
  name: string;
  issuer: string;
  date: string;
  pdf_url?: string;
  thumbnail_url?: string;
}

export interface CustomSection {
  id: string;
  title: string;
  content: string;
  media: string[];
  links: { label: string; url: string }[];
}

export interface ContactSettings {
  email: string | null;
  whatsapp: string | null;
  show_form: boolean;
  sticky_button: boolean;
}

export interface SEOSettings {
  meta_title: string | null;
  meta_description: string | null;
  favicon_url: string | null;
  og_image_url: string | null;
}

export interface SectionVisibility {
  hero: boolean;
  about: boolean;
  skills: boolean;
  projects: boolean;
  experience: boolean;
  education: boolean;
  testimonials: boolean;
  contact: boolean;
  [key: string]: boolean;
}

export interface SectionTitles {
  hero: string;
  about: string;
  skills: string;
  projects: string;
  experience: string;
  education: string;
  testimonials: string;
  contact: string;
  [key: string]: string;
}

export interface PortfolioTheme {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
}

export interface PortfolioVersion {
  id: string;
  timestamp: string;
  snapshot: Partial<Portfolio>;
  label?: string;
}

export interface Portfolio {
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
  links: { github?: string; linkedin?: string; website?: string; twitter?: string; dribbble?: string; behance?: string };
  template: string;
  theme: PortfolioTheme;
  resume_text: string | null;
  quality_score: number | null;
  profile_picture_url: string | null;
  testimonials: Testimonial[];
  certificates: Certificate[];
  custom_sections: CustomSection[];
  section_order: string[];
  section_visibility: SectionVisibility;
  section_titles: SectionTitles;
  contact_settings: ContactSettings;
  seo_settings: SEOSettings;
  color_mode: 'dark' | 'light';
  version_history: PortfolioVersion[];
}

export interface PortfolioLink {
  id: string;
  portfolio_id: string;
  user_id: string;
  slug: string;
  name: string;
  section_visibility: SectionVisibility;
  is_active: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
}
