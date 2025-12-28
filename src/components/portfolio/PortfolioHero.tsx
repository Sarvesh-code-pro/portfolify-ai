import { motion } from "framer-motion";
import { Github, Linkedin, Globe, Twitter, Mail, ArrowRight, ArrowDown, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";

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

// Floating particle component
function FloatingParticle({ delay, x, y }: { delay: number; x: number; y: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-primary/40"
      initial={{ opacity: 0, x, y }}
      animate={{
        opacity: [0, 0.8, 0],
        y: [y, y - 100],
        x: [x, x + (Math.random() - 0.5) * 50],
      }}
      transition={{
        duration: 4,
        delay,
        repeat: Infinity,
        ease: "easeOut",
      }}
    />
  );
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
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [particles] = useState(() =>
    Array.from({ length: 20 }, (_, i) => ({
      id: i,
      delay: Math.random() * 4,
      x: Math.random() * 100,
      y: Math.random() * 100 + 50,
    }))
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({
        x: (e.clientX / window.innerWidth) * 100,
        y: (e.clientY / window.innerHeight) * 100,
      });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleLinkClick = (type: string, url: string) => {
    onLinkClick?.(type, url);
  };

  const formatUrl = (url: string) => url.startsWith("http") ? url : `https://${url}`;

  // Split name for animated display
  const nameParts = name.split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts.slice(1).join(' ');

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-background" />
      
      {/* Gradient orbs */}
      <motion.div
        className="hero-glow-large top-0 left-1/4"
        animate={{
          x: mousePosition.x * 0.3,
          y: mousePosition.y * 0.3,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
      />
      <motion.div
        className="hero-glow-large bottom-0 right-1/4 opacity-60"
        style={{ background: "radial-gradient(ellipse at center, hsl(262 83% 58% / 0.1) 0%, transparent 60%)" }}
        animate={{
          x: -mousePosition.x * 0.2,
          y: -mousePosition.y * 0.2,
        }}
        transition={{ type: "spring", damping: 30, stiffness: 100 }}
      />
      
      {/* Floating particles */}
      <div className="absolute inset-0 pointer-events-none">
        {particles.map((p) => (
          <FloatingParticle key={p.id} delay={p.delay} x={p.x} y={p.y} />
        ))}
      </div>

      {/* Grid pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]" style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: '80px 80px',
      }} />

      {/* Noise texture */}
      <div className="absolute inset-0 noise-overlay" />

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        {/* Availability Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 backdrop-blur-sm"
        >
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="w-2 h-2 rounded-full bg-success"
          />
          <span className="text-sm text-muted-foreground">Available for new projects</span>
          <Sparkles className="w-3 h-3 text-primary" />
        </motion.div>

        {/* Profile Picture with animated ring */}
        {profilePicture && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-10"
          >
            <div className="relative inline-block">
              {/* Animated ring */}
              <motion.div
                className="absolute -inset-3 rounded-full"
                style={{
                  background: "linear-gradient(135deg, hsl(217 91% 60%), hsl(262 83% 58%), hsl(217 91% 60%))",
                  backgroundSize: "200% 200%",
                }}
                animate={{
                  backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
                }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              />
              <div className="relative w-36 h-36 rounded-full overflow-hidden border-4 border-background">
                <img 
                  src={profilePicture} 
                  alt={name}
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Status indicator */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="absolute -bottom-1 -right-1 w-10 h-10 bg-background rounded-full flex items-center justify-center"
              >
                <div className="w-6 h-6 bg-success rounded-full flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-2 h-2 bg-background rounded-full"
                  />
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Main Headline */}
        <div className="mb-6 overflow-hidden">
          <motion.h1
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight"
          >
            <span className="block text-foreground">Hi, I'm {firstName}</span>
            {lastName && <span className="block text-foreground">{lastName}</span>}
          </motion.h1>
        </div>

        {/* Animated Role */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mb-6"
        >
          <h2 className="text-3xl md:text-5xl font-bold">
            <span className="gradient-text text-glow">{title}</span>
          </h2>
        </motion.div>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          {subtitle}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-wrap items-center justify-center gap-4 mb-12"
        >
          {contactEmail && (
            <Button size="lg" className="gap-2 glow-effect group text-base px-8 py-6" asChild>
              <a href={`mailto:${contactEmail}`}>
                Let's Connect 
                <motion.span
                  className="inline-block"
                  animate={{ x: [0, 4, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <ArrowRight className="w-5 h-5" />
                </motion.span>
              </a>
            </Button>
          )}
          <Button size="lg" variant="outline" className="gap-2 text-base px-8 py-6" asChild>
            <a href="#projects">View My Work</a>
          </Button>
        </motion.div>

        {/* Social Links */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="flex items-center justify-center gap-3 mb-16"
        >
          {[
            { key: 'github', icon: Github, url: links.github },
            { key: 'linkedin', icon: Linkedin, url: links.linkedin },
            { key: 'twitter', icon: Twitter, url: links.twitter },
            { key: 'website', icon: Globe, url: links.website },
          ].filter(l => l.url).map((link, index) => (
            <motion.a
              key={link.key}
              href={formatUrl(link.url!)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleLinkClick(link.key, link.url!)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 + index * 0.1 }}
              whileHover={{ scale: 1.1, y: -2 }}
              whileTap={{ scale: 0.95 }}
              className="p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-primary/50 hover:bg-secondary/50 transition-colors"
            >
              <link.icon className="w-5 h-5" />
            </motion.a>
          ))}
        </motion.div>

        {/* Stats */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto"
          >
            {[
              { value: stats.projects, label: "Projects", show: stats.projects && stats.projects > 0 },
              { value: stats.experience, label: "Years Exp", show: stats.experience && stats.experience > 0 },
              { value: stats.clients, label: "Clients", show: stats.clients && stats.clients > 0 },
              { value: "5.0", label: "Avg Rating", show: true },
            ].filter(s => s.show).map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.1 + index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="p-6 rounded-2xl bg-card/30 border border-border/30 backdrop-blur-sm"
              >
                <div className="text-3xl md:text-4xl font-bold gradient-text mb-1">
                  {typeof stat.value === 'number' ? `${stat.value}+` : stat.value}
                </div>
                <div className="text-sm text-muted-foreground uppercase tracking-wider">{stat.label}</div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.a
          href="#about"
          animate={{ y: [0, 8, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
        >
          <span className="text-xs uppercase tracking-widest">Scroll</span>
          <ArrowDown className="w-4 h-4" />
        </motion.a>
      </motion.div>
    </section>
  );
}
