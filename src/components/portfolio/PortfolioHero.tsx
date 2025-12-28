import { Github, Linkedin, Globe, Twitter, Mail, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PortfolioHeroProps {
  name: string;
  title: string;
  subtitle: string;
  profilePicture?: string | null;
  links: {
    github?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
  };
  stats?: {
    projects?: number;
    experience?: number;
    clients?: number;
  };
  onLinkClick?: (linkType: string, linkUrl: string) => void;
  contactEmail?: string | null;
}

export function PortfolioHero({
  name,
  title,
  subtitle,
  profilePicture,
  links,
  stats,
  onLinkClick,
  contactEmail
}: PortfolioHeroProps) {
  const handleLinkClick = (type: string, url: string) => {
    onLinkClick?.(type, url);
  };

  const formatUrl = (url: string) => url.startsWith("http") ? url : `https://${url}`;

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-card/50" />
      <div className="hero-glow top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2" />
      <div className="hero-glow bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 opacity-50" />
      
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.02]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
          <span className="text-primary text-sm">✨</span>
          <span className="text-sm text-muted-foreground">Available for new projects</span>
        </div>

        {/* Profile Picture */}
        {profilePicture && (
          <div className="mb-8 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            <div className="relative inline-block">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-primary/20 glow-effect">
                <img 
                  src={profilePicture} 
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-success rounded-full flex items-center justify-center border-4 border-background">
                <div className="w-2 h-2 bg-success-foreground rounded-full animate-pulse" />
              </div>
            </div>
          </div>
        )}

        {/* Main Title with Gradient */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold mb-6 animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <span className="text-foreground">{name.split(' ')[0]}</span>
          {name.split(' ').length > 1 && (
            <>
              <span className="text-foreground">, </span>
              <span className="gradient-text">{title}</span>
            </>
          )}
          {name.split(' ').length === 1 && (
            <>
              <br />
              <span className="gradient-text">{title}</span>
            </>
          )}
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 animate-slide-up" style={{ animationDelay: '0.3s' }}>
          {subtitle}
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-12 animate-slide-up" style={{ animationDelay: '0.4s' }}>
          {contactEmail && (
            <Button size="lg" className="gap-2 glow-effect" asChild>
              <a href={`mailto:${contactEmail}`}>
                Let's Connect <ArrowRight className="w-4 h-4" />
              </a>
            </Button>
          )}
          <Button size="lg" variant="outline" className="gap-2" asChild>
            <a href="#projects">View Projects</a>
          </Button>
        </div>

        {/* Social Links */}
        <div className="flex items-center justify-center gap-4 mb-16 animate-slide-up" style={{ animationDelay: '0.5s' }}>
          {links.github && (
            <a 
              href={formatUrl(links.github)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick("github", links.github!)}
              className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all hover:scale-110"
            >
              <Github className="w-5 h-5" />
            </a>
          )}
          {links.linkedin && (
            <a 
              href={formatUrl(links.linkedin)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick("linkedin", links.linkedin!)}
              className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all hover:scale-110"
            >
              <Linkedin className="w-5 h-5" />
            </a>
          )}
          {links.twitter && (
            <a 
              href={formatUrl(links.twitter)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick("twitter", links.twitter!)}
              className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all hover:scale-110"
            >
              <Twitter className="w-5 h-5" />
            </a>
          )}
          {links.website && (
            <a 
              href={formatUrl(links.website)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick("website", links.website!)}
              className="p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-all hover:scale-110"
            >
              <Globe className="w-5 h-5" />
            </a>
          )}
        </div>

        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto animate-slide-up" style={{ animationDelay: '0.6s' }}>
            {stats.projects !== undefined && stats.projects > 0 && (
              <div className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stats.projects}+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">Projects</div>
              </div>
            )}
            {stats.experience !== undefined && stats.experience > 0 && (
              <div className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stats.experience}+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">Years Exp</div>
              </div>
            )}
            {stats.clients !== undefined && stats.clients > 0 && (
              <div className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">{stats.clients}+</div>
                <div className="text-sm text-muted-foreground uppercase tracking-wide">Clients</div>
              </div>
            )}
            <div className="p-6 rounded-2xl bg-card/50 border border-border/50 backdrop-blur-sm">
              <div className="text-3xl md:text-4xl font-bold text-success mb-1">5.0</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">Avg Rating</div>
            </div>
          </div>
        )}
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex items-start justify-center p-2">
          <div className="w-1 h-2 bg-muted-foreground/50 rounded-full" />
        </div>
      </div>
    </section>
  );
}
