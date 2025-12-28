import { Mail, Phone, ArrowRight, Github, Linkedin, Globe, Twitter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";

interface PortfolioContactProps {
  title?: string;
  email?: string | null;
  whatsapp?: string | null;
  showForm?: boolean;
  links?: {
    github?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
  };
}

export function PortfolioContact({ 
  title = "Ready to Connect?", 
  email, 
  whatsapp,
  showForm = true,
  links = {}
}: PortfolioContactProps) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });

  const formatUrl = (url: string) => url.startsWith("http") ? url : `https://${url}`;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      const subject = encodeURIComponent(`Message from ${formData.name}`);
      const body = encodeURIComponent(`${formData.message}\n\nFrom: ${formData.name} (${formData.email})`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
  };

  return (
    <section id="contact" className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-card/50 to-card" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="gradient-text">{title}</span>
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Let's discuss your next project and bring your ideas to life
          </p>
          <div className="w-24 h-1 bg-gradient-to-r from-primary to-purple-500 mx-auto rounded-full mt-4" />
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          {/* Contact Info */}
          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-semibold mb-4">Get in Touch</h3>
              <p className="text-muted-foreground mb-6">
                I'm always open to discussing new projects, creative ideas, or opportunities to be part of your vision.
              </p>
            </div>

            <div className="space-y-4">
              {email && (
                <a 
                  href={`mailto:${email}`}
                  className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <Mail className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="font-medium">{email}</p>
                  </div>
                </a>
              )}

              {whatsapp && (
                <a 
                  href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl bg-card/50 border border-border/50 hover:border-success/50 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                    <Phone className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">WhatsApp</p>
                    <p className="font-medium">{whatsapp}</p>
                  </div>
                </a>
              )}
            </div>

            {/* Social Links */}
            {Object.values(links).some(Boolean) && (
              <div className="pt-4">
                <p className="text-sm text-muted-foreground mb-4">Follow me on</p>
                <div className="flex gap-3">
                  {links.github && (
                    <a 
                      href={formatUrl(links.github)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <Github className="w-5 h-5" />
                    </a>
                  )}
                  {links.linkedin && (
                    <a 
                      href={formatUrl(links.linkedin)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <Linkedin className="w-5 h-5" />
                    </a>
                  )}
                  {links.twitter && (
                    <a 
                      href={formatUrl(links.twitter)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <Twitter className="w-5 h-5" />
                    </a>
                  )}
                  {links.website && (
                    <a 
                      href={formatUrl(links.website)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-3 rounded-xl bg-card border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                    >
                      <Globe className="w-5 h-5" />
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Contact Form */}
          {showForm && email && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Input
                  placeholder="Your Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-card/50 border-border/50"
                  required
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder="Your Email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-card/50 border-border/50"
                  required
                />
              </div>
              <div>
                <Textarea
                  placeholder="Your Message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="bg-card/50 border-border/50 min-h-[150px]"
                  required
                />
              </div>
              <Button type="submit" size="lg" className="w-full gap-2">
                Send Message <ArrowRight className="w-4 h-4" />
              </Button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
