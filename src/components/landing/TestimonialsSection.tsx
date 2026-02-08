import { motion } from "framer-motion";
import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Sarah Chen",
    role: "Frontend Developer",
    quote: "I went from zero to a stunning portfolio in under 5 minutes. The AI understood my tech stack perfectly.",
    avatar: "SC",
    rating: 5,
  },
  {
    name: "Marcus Rivera",
    role: "Product Designer",
    quote: "The templates are gorgeous and the editor is incredibly intuitive. Best portfolio builder I've used.",
    avatar: "MR",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "Data Scientist",
    quote: "It even formatted my ML projects and research papers beautifully. Highly recommend for tech professionals.",
    avatar: "PP",
    rating: 5,
  },
  {
    name: "James Okafor",
    role: "DevOps Engineer",
    quote: "My portfolio now showcases my infrastructure work in a way recruiters actually understand. Game changer.",
    avatar: "JO",
    rating: 5,
  },
  {
    name: "Emily Zhang",
    role: "UX Researcher",
    quote: "The voice agent feature blew my mind. Visitors can literally ask my portfolio questions about my work.",
    avatar: "EZ",
    rating: 5,
  },
  {
    name: "Alex Thompson",
    role: "Full Stack Developer",
    quote: "Clean, fast, and professional. I got interview callbacks the same week I published my portfolio.",
    avatar: "AT",
    rating: 5,
  },
];

export function TestimonialsSection() {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/[0.02] to-transparent" />

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Loved by <span className="gradient-text">professionals</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands who've elevated their online presence.
          </p>
        </motion.div>

        {/* Marquee-style rows */}
        <div className="space-y-6 max-w-6xl mx-auto">
          {/* Row 1 */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.slice(0, 3).map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all group"
              >
                <Quote className="w-8 h-8 text-primary/10 absolute top-4 right-4" />

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                  ))}
                </div>

                <p className="text-foreground/80 text-sm leading-relaxed mb-5">"{t.quote}"</p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Row 2 */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.slice(3, 6).map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.1 }}
                whileHover={{ y: -6, transition: { duration: 0.2 } }}
                className="relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all group"
              >
                <Quote className="w-8 h-8 text-primary/10 absolute top-4 right-4" />

                <div className="flex items-center gap-1 mb-4">
                  {[...Array(t.rating)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-[hsl(var(--warning))] text-[hsl(var(--warning))]" />
                  ))}
                </div>

                <p className="text-foreground/80 text-sm leading-relaxed mb-5">"{t.quote}"</p>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-[hsl(262_83%_58%)] flex items-center justify-center text-sm font-bold text-primary-foreground">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
