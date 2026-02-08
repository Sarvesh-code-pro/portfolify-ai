import { motion } from "framer-motion";
import { Sparkles, Palette, Globe, Zap, Edit3, Shield } from "lucide-react";
import { useMousePosition } from "@/hooks/use-scroll-animation";

const features = [
  {
    icon: Sparkles,
    title: "AI-Powered Content",
    description: "Our AI understands your role and generates professional, recruiter-ready content automatically.",
  },
  {
    icon: Palette,
    title: "Beautiful Templates",
    description: "Choose from role-specific templates designed by professionals. Switch anytime without losing content.",
  },
  {
    icon: Edit3,
    title: "Visual Editor",
    description: "Customize every detail with our intuitive split-screen editor. See changes in real-time.",
  },
  {
    icon: Globe,
    title: "Instant Publishing",
    description: "Publish your portfolio with one click. Get your unique URL and share it with the world.",
  },
  {
    icon: Zap,
    title: "Lightning Fast",
    description: "Optimized for speed. Your portfolio loads instantly on any device, anywhere.",
  },
  {
    icon: Shield,
    title: "SEO Optimized",
    description: "Built-in SEO best practices help recruiters and clients find you easily.",
  },
];

export function FeaturesSection() {
  const mouseRef = useMousePosition();

  return (
    <section id="features" className="py-24 relative" ref={mouseRef}>
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="text-center mb-16"
        >
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Everything you need to <span className="gradient-text">stand out</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional portfolio creation made simple. Focus on your work, let AI handle the rest.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              whileHover={{ y: -8, transition: { duration: 0.25 } }}
              className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5 spotlight-card"
            >
              <motion.div
                className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
              >
                <feature.icon className="w-6 h-6 text-primary" />
              </motion.div>
              <h3 className="font-display text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
