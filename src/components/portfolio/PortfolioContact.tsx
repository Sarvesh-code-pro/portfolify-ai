import { motion, AnimatePresence } from "framer-motion";
import { Mail, Phone, ArrowRight, Github, Linkedin, Globe, Twitter, Send, MessageCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { AnimatedSection } from "./AnimatedSection";

interface PortfolioContactProps {
  title?: string;
  email?: string | null;
  whatsapp?: string | null;
  showForm?: boolean;
  showStickyButton?: boolean;
  links?: {
    github?: string;
    linkedin?: string;
    website?: string;
    twitter?: string;
  };
}

function StickyContactButton({ email, whatsapp }: { email?: string | null; whatsapp?: string | null }) {
  const [isOpen, setIsOpen] = useState(false);

  const contactOptions = [
    { icon: Mail, label: "Email", href: email ? `mailto:${email}` : null, color: "bg-primary" },
    { icon: MessageCircle, label: "WhatsApp", href: whatsapp ? `https://wa.me/${whatsapp.replace(/\D/g, '')}` : null, color: "bg-success" },
  ].filter(opt => opt.href);

  if (contactOptions.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="absolute bottom-16 right-0 flex flex-col gap-3 mb-2"
          >
            {contactOptions.map((option, index) => (
              <motion.a
                key={option.label}
                href={option.href!}
                target={option.label === "WhatsApp" ? "_blank" : undefined}
                rel="noopener noreferrer"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className={`flex items-center gap-3 px-4 py-3 rounded-full ${option.color} text-primary-foreground shadow-lg`}
              >
                <option.icon className="w-5 h-5" />
                <span className="font-medium">{option.label}</span>
              </motion.a>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        animate={{ rotate: isOpen ? 45 : 0 }}
        className="w-14 h-14 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 flex items-center justify-center"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}

export function PortfolioContact({
  title = "Let's Work Together",
  email,
  whatsapp,
  showForm = true,
  showStickyButton = true,
  links = {}
}: PortfolioContactProps) {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatUrl = (url: string) => url.startsWith("http") ? url : `https://${url}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate submission
    await new Promise(resolve => setTimeout(resolve, 500));
    
    if (email) {
      const subject = encodeURIComponent(`Message from ${formData.name}`);
      const body = encodeURIComponent(`${formData.message}\n\nFrom: ${formData.name} (${formData.email})`);
      window.location.href = `mailto:${email}?subject=${subject}&body=${body}`;
    }
    
    setIsSubmitting(false);
  };

  const socialLinks = [
    { key: 'github', icon: Github, url: links.github, label: 'GitHub' },
    { key: 'linkedin', icon: Linkedin, url: links.linkedin, label: 'LinkedIn' },
    { key: 'twitter', icon: Twitter, url: links.twitter, label: 'Twitter' },
    { key: 'website', icon: Globe, url: links.website, label: 'Website' },
  ].filter(l => l.url);

  return (
    <>
      <section id="contact" className="py-32 px-6 relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-card/50" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-radial from-primary/10 to-transparent rounded-full blur-3xl" />
        
        <div className="max-w-5xl mx-auto relative z-10">
          {/* Header */}
          <AnimatedSection className="text-center mb-16">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6"
            >
              <span>💬</span>
              <span>Get In Touch</span>
            </motion.div>
            
            <h2 className="text-4xl md:text-6xl font-bold mb-4">
              <span className="gradient-text">{title}</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have a project in mind? Let's create something amazing together.
            </p>
          </AnimatedSection>

          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Contact Info */}
            <AnimatedSection delay={0.1}>
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-semibold mb-4">Let's Connect</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    I'm always excited to discuss new projects, creative ideas, or opportunities to collaborate. Don't hesitate to reach out!
                  </p>
                </div>

                <div className="space-y-4">
                  {email && (
                    <motion.a
                      href={`mailto:${email}`}
                      whileHover={{ x: 8 }}
                      className="flex items-center gap-4 p-5 rounded-2xl bg-card/30 border border-border/30 hover:border-primary/30 transition-all group"
                    >
                      <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                        <Mail className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Email me at</p>
                        <p className="font-semibold text-lg">{email}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-primary transition-colors" />
                    </motion.a>
                  )}

                  {whatsapp && (
                    <motion.a
                      href={`https://wa.me/${whatsapp.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      whileHover={{ x: 8 }}
                      className="flex items-center gap-4 p-5 rounded-2xl bg-card/30 border border-border/30 hover:border-success/30 transition-all group"
                    >
                      <div className="w-14 h-14 rounded-xl bg-success/10 flex items-center justify-center group-hover:bg-success/20 transition-colors">
                        <Phone className="w-6 h-6 text-success" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">WhatsApp</p>
                        <p className="font-semibold text-lg">{whatsapp}</p>
                      </div>
                      <ArrowRight className="w-5 h-5 ml-auto text-muted-foreground group-hover:text-success transition-colors" />
                    </motion.a>
                  )}
                </div>

                {/* Social Links */}
                {socialLinks.length > 0 && (
                  <div className="pt-6 border-t border-border/30">
                    <p className="text-sm text-muted-foreground mb-4">Find me on</p>
                    <div className="flex gap-3">
                      {socialLinks.map((link, index) => (
                        <motion.a
                          key={link.key}
                          href={formatUrl(link.url!)}
                          target="_blank"
                          rel="noopener noreferrer"
                          initial={{ opacity: 0, y: 20 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: 0.3 + index * 0.1 }}
                          whileHover={{ y: -4, scale: 1.1 }}
                          whileTap={{ scale: 0.95 }}
                          className="p-4 rounded-xl bg-card/50 border border-border/50 hover:border-primary/50 hover:bg-primary/5 transition-all"
                        >
                          <link.icon className="w-5 h-5" />
                        </motion.a>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </AnimatedSection>

            {/* Contact Form */}
            {showForm && email && (
              <AnimatedSection delay={0.2}>
                <motion.form
                  onSubmit={handleSubmit}
                  className="p-8 rounded-3xl bg-card/30 border border-border/30 backdrop-blur-sm space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Your Name</label>
                    <Input
                      placeholder="John Doe"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="bg-background/50 border-border/50 h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Your Email</label>
                    <Input
                      type="email"
                      placeholder="john@example.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="bg-background/50 border-border/50 h-12"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-muted-foreground">Your Message</label>
                    <Textarea
                      placeholder="Tell me about your project..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="bg-background/50 border-border/50 min-h-[150px] resize-none"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="lg"
                    disabled={isSubmitting}
                    className="w-full gap-2 h-12 text-base"
                  >
                    {isSubmitting ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        className="w-5 h-5 border-2 border-primary-foreground border-t-transparent rounded-full"
                      />
                    ) : (
                      <>
                        Send Message <Send className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </motion.form>
              </AnimatedSection>
            )}
          </div>
        </div>
      </section>

      {/* Sticky Contact Button */}
      {showStickyButton && <StickyContactButton email={email} whatsapp={whatsapp} />}
    </>
  );
}
